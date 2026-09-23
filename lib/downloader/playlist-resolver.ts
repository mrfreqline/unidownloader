export const PLAYLIST_TRACK_LIMIT = 50

export type PlaylistSource = 'youtube' | 'spotify'

export interface PlaylistTrack {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  duration?: string
  youtubeUrl?: string
  searchQuery?: string
}

export interface PlaylistResult {
  source: PlaylistSource
  kind: 'playlist' | 'album' | 'track'
  title: string
  thumbnail?: string
  tracks: PlaylistTrack[]
  truncated: boolean
  note?: string
}

const YT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const YT_INNERTUBE_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240815.00.00',
    hl: 'en',
    gl: 'US',
  },
}

export function isYoutubePlaylistUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim())
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (!host.includes('youtube.com') && host !== 'youtu.be' && host !== 'music.youtube.com') return false
    if (u.pathname.includes('/playlist')) return true
    const list = u.searchParams.get('list') || ''
    if (/^(PL|OL|UU|FL)/i.test(list)) return true
    return false
  } catch {
    return false
  }
}

export function isSpotifyUrl(raw: string): boolean {
  const t = raw.trim()
  if (/^spotify:(playlist|album|track):/i.test(t)) return true
  try {
    const u = new URL(t)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    return host === 'open.spotify.com' || host === 'spotify.link' || host === 'spotify.app.link'
  } catch {
    return false
  }
}

export function isPlaylistOrCollectionUrl(raw: string): boolean {
  return isYoutubePlaylistUrl(raw) || isSpotifyUrl(raw)
}

function extractYoutubePlaylistId(raw: string): string | null {
  try {
    const u = new URL(raw.trim())
    const list = u.searchParams.get('list')
    if (list && /^(PL|OL|UU|FL)[a-zA-Z0-9_-]+$/i.test(list)) return list
    const m = u.pathname.match(/\/playlist\/([a-zA-Z0-9_-]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function parseSpotifyResource(raw: string): { type: 'playlist' | 'album' | 'track'; id: string } | null {
  const uri = raw.trim().match(/^spotify:(playlist|album|track):([a-zA-Z0-9]+)$/i)
  if (uri) return { type: uri[1].toLowerCase() as 'playlist' | 'album' | 'track', id: uri[2] }
  try {
    const u = new URL(raw.trim())
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex(p => ['playlist', 'album', 'track'].includes(p.toLowerCase()))
    if (idx !== -1 && parts[idx + 1]) {
      const id = parts[idx + 1].split('?')[0]
      if (/^[a-zA-Z0-9]+$/.test(id)) {
        return { type: parts[idx].toLowerCase() as 'playlist' | 'album' | 'track', id }
      }
    }
  } catch {}
  return null
}

function walkFind(obj: any, predicate: (node: any) => boolean, acc: any[] = [], depth = 0): any[] {
  if (!obj || typeof obj !== 'object' || depth > 40 || acc.length >= 200) return acc
  if (predicate(obj)) acc.push(obj)
  if (Array.isArray(obj)) {
    for (const item of obj) walkFind(item, predicate, acc, depth + 1)
  } else {
    for (const v of Object.values(obj)) walkFind(v, predicate, acc, depth + 1)
  }
  return acc
}

function formatSeconds(total?: number): string | undefined {
  if (!total || !Number.isFinite(total) || total <= 0) return undefined
  const s = Math.floor(total)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

async function fetchYoutubePlaylistTracks(playlistId: string): Promise<PlaylistResult> {
  const tracks: PlaylistTrack[] = []
  let title = 'YouTube Playlist'
  let thumbnail: string | undefined

  try {
    const browseId = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`
    const res = await fetch('https://www.youtube.com/youtubei/v3/browse?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': YT_UA,
      },
      body: JSON.stringify({ context: YT_INNERTUBE_CONTEXT, browseId }),
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok) {
      const data = await res.json()
      const headerTitle =
        data?.header?.playlistHeaderRenderer?.title?.simpleText ||
        data?.metadata?.playlistMetadataRenderer?.title
      if (headerTitle) title = headerTitle
      const renderers = walkFind(data, n => n?.playlistVideoRenderer?.videoId)
      for (const node of renderers) {
        const v = node.playlistVideoRenderer
        const videoId = v?.videoId
        if (!videoId || tracks.some(t => t.id === videoId)) continue
        const tTitle =
          v?.title?.runs?.[0]?.text || v?.title?.simpleText || `YouTube video ${videoId}`
        const artist = v?.shortBylineText?.runs?.[0]?.text
        const length = v?.lengthText?.simpleText
        const thumb = v?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url
        if (!thumbnail && thumb) thumbnail = thumb
        tracks.push({
          id: videoId,
          title: tTitle,
          artist,
          thumbnail: thumb,
          duration: length,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        })
        if (tracks.length >= PLAYLIST_TRACK_LIMIT) break
      }
    }
  } catch (err) {
    console.warn('[YouTube playlist innertube warn]:', err)
  }

  if (tracks.length === 0) {
    try {
      const htmlRes = await fetch(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`, {
        headers: { 'User-Agent': YT_UA, 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(12000),
      })
      const html = await htmlRes.text()
      const initial = html.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/)
      if (initial) {
        const data = JSON.parse(initial[1])
        const headerTitle =
          data?.header?.playlistHeaderRenderer?.title?.simpleText ||
          data?.metadata?.playlistMetadataRenderer?.title
        if (headerTitle) title = headerTitle
        const renderers = walkFind(data, n => n?.playlistVideoRenderer?.videoId)
        for (const node of renderers) {
          const v = node.playlistVideoRenderer
          const videoId = v?.videoId
          if (!videoId || tracks.some(t => t.id === videoId)) continue
          tracks.push({
            id: videoId,
            title: v?.title?.runs?.[0]?.text || v?.title?.simpleText || `YouTube video ${videoId}`,
            artist: v?.shortBylineText?.runs?.[0]?.text,
            thumbnail: v?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url,
            duration: v?.lengthText?.simpleText,
            youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          })
          if (tracks.length >= PLAYLIST_TRACK_LIMIT) break
        }
      }
    } catch (err) {
      console.warn('[YouTube playlist HTML warn]:', err)
    }
  }

  if (tracks.length === 0) {
    throw new Error('Could not read this YouTube playlist. Make sure it is public, not a Mix/radio, and try again.')
  }

  return {
    source: 'youtube',
    kind: 'playlist',
    title,
    thumbnail,
    tracks: tracks.slice(0, PLAYLIST_TRACK_LIMIT),
    truncated: tracks.length >= PLAYLIST_TRACK_LIMIT,
  }
}

export async function searchYouTubeVideo(query: string): Promise<{ videoId: string; title: string; thumbnail?: string } | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v3/search?prettyPrint=false', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': YT_UA,
      },
      body: JSON.stringify({ context: YT_INNERTUBE_CONTEXT, query: q }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const videos = walkFind(data, n => n?.videoRenderer?.videoId)
    const v = videos[0]?.videoRenderer
    if (!v?.videoId) return null
    return {
      videoId: v.videoId,
      title: v.title?.runs?.[0]?.text || v.title?.simpleText || q,
      thumbnail: v.thumbnail?.thumbnails?.slice(-1)?.[0]?.url,
    }
  } catch (err) {
    console.warn('[YouTube search warn]:', err)
    return null
  }
}

async function getSpotifyToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) return null
  const basic = Buffer.from(`${id}:${secret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token || null
}

function mapSpotifyTrack(item: any): PlaylistTrack | null {
  const track = item?.track || item
  if (!track?.name) return null
  if (track.is_local) return null
  const artists = Array.isArray(track.artists) ? track.artists.map((a: any) => a.name).filter(Boolean).join(', ') : ''
  const images = track.album?.images || []
  const thumb = images[images.length - 1]?.url || images[0]?.url
  const query = [artists, track.name].filter(Boolean).join(' ')
  return {
    id: track.id || `${track.name}-${query}`.slice(0, 40),
    title: track.name,
    artist: artists,
    thumbnail: thumb,
    duration: formatSeconds((track.duration_ms || 0) / 1000),
    searchQuery: query,
  }
}

async function fetchSpotifyViaApi(
  type: 'playlist' | 'album' | 'track',
  id: string,
  token: string
): Promise<PlaylistResult> {
  const headers = { Authorization: `Bearer ${token}` }
  const tracks: PlaylistTrack[] = []
  let title = 'Spotify collection'
  let thumbnail: string | undefined

  if (type === 'track') {
    const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error('Spotify track was not found or is not public.')
    const data = await res.json()
    const mapped = mapSpotifyTrack(data)
    if (!mapped) throw new Error('Could not read that Spotify track.')
    return {
      source: 'spotify',
      kind: 'track',
      title: mapped.artist ? `${mapped.artist} – ${mapped.title}` : mapped.title,
      thumbnail: mapped.thumbnail,
      tracks: [mapped],
      truncated: false,
      note: 'Spotify does not provide MP3 files. Each song is matched on YouTube, then converted.',
    }
  }

  if (type === 'album') {
    const albumRes = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!albumRes.ok) throw new Error('Spotify album was not found or is not public.')
    const album = await albumRes.json()
    title = album.name || title
    thumbnail = album.images?.[0]?.url
    let url: string | null = `https://api.spotify.com/v1/albums/${id}/tracks?limit=50`
    while (url && tracks.length < PLAYLIST_TRACK_LIMIT) {
      const page: Response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
      if (!page.ok) break
      const json = await page.json()
      for (const item of json.items || []) {
        const mapped = mapSpotifyTrack({ ...item, album })
        if (mapped) tracks.push(mapped)
        if (tracks.length >= PLAYLIST_TRACK_LIMIT) break
      }
      url = json.next
    }
  } else {
    const plRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!plRes.ok) throw new Error('Spotify playlist was not found. Make sure it is public.')
    const playlist = await plRes.json()
    title = playlist.name || title
    thumbnail = playlist.images?.[0]?.url
    let url: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=50`
    while (url && tracks.length < PLAYLIST_TRACK_LIMIT) {
      const page = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
      if (!page.ok) break
      const json = await page.json()
      for (const item of json.items || []) {
        const mapped = mapSpotifyTrack(item)
        if (mapped) tracks.push(mapped)
        if (tracks.length >= PLAYLIST_TRACK_LIMIT) break
      }
      url = json.next
    }
  }

  if (tracks.length === 0) {
    throw new Error('This Spotify link has no public playable tracks.')
  }

  return {
    source: 'spotify',
    kind: type,
    title,
    thumbnail,
    tracks: tracks.slice(0, PLAYLIST_TRACK_LIMIT),
    truncated: tracks.length >= PLAYLIST_TRACK_LIMIT,
    note: 'Spotify does not provide MP3 files. Each song is matched on YouTube, then converted.',
  }
}

async function fetchSpotifyViaEmbed(
  type: 'playlist' | 'album' | 'track',
  id: string
): Promise<PlaylistResult> {
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}`
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': YT_UA,
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(
      'Could not read this Spotify link. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel env, or make sure the playlist is public.'
    )
  }
  const html = await res.text()
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/)
  const tracks: PlaylistTrack[] = []
  let title = 'Spotify collection'
  let thumbnail: string | undefined

  const pushTrack = (name: string, artist?: string, durationMs?: number, thumb?: string, tid?: string) => {
    if (!name) return
    const query = [artist, name].filter(Boolean).join(' ')
    if (tracks.some(t => t.title === name && t.artist === artist)) return
    tracks.push({
      id: tid || `${name}-${tracks.length}`,
      title: name,
      artist,
      thumbnail: thumb,
      duration: formatSeconds((durationMs || 0) / 1000),
      searchQuery: query,
    })
  }

  if (nextData) {
    try {
      const json = JSON.parse(nextData[1])
      const entities = walkFind(json, n => n && typeof n === 'object' && n.name && (n.type === 'track' || n.duration_ms || n.artists))
      const header = walkFind(json, n => n?.type === type && n?.name).find((n: any) => n.id === id) || {}
      if (header.name) title = header.name
      thumbnail = header.images?.[0]?.url || header.visualIdentity?.image?.[0]?.url
      for (const n of entities) {
        if (n.type && n.type !== 'track' && !n.duration_ms) continue
        const artists = Array.isArray(n.artists)
          ? n.artists.map((a: any) => a.name || a).filter(Boolean).join(', ')
          : n.subtitle || n.artist
        pushTrack(n.name, artists, n.duration_ms, n.album?.images?.[0]?.url || thumbnail, n.id)
        if (tracks.length >= PLAYLIST_TRACK_LIMIT) break
      }
    } catch {}
  }

  if (tracks.length === 0) {
    throw new Error(
      'Could not list Spotify songs without API keys. In Vercel add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (free from developer.spotify.com).'
    )
  }

  return {
    source: 'spotify',
    kind: type,
    title,
    thumbnail,
    tracks: tracks.slice(0, PLAYLIST_TRACK_LIMIT),
    truncated: tracks.length >= PLAYLIST_TRACK_LIMIT,
    note: 'Spotify does not provide MP3 files. Each song is matched on YouTube, then converted.',
  }
}

async function resolveMaybeShortUrl(raw: string): Promise<string> {
  const t = raw.trim()
  try {
    const host = new URL(t).hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'spotify.link' && host !== 'spotify.app.link' && host !== 'youtu.be') return t
    const res = await fetch(t, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': YT_UA } })
    return res.url || t
  } catch {
    return t
  }
}

export async function listPlaylistTracks(rawUrl: string): Promise<PlaylistResult> {
  const resolved = await resolveMaybeShortUrl(rawUrl)

  if (isSpotifyUrl(resolved) || isSpotifyUrl(rawUrl)) {
    const resource = parseSpotifyResource(resolved) || parseSpotifyResource(rawUrl)
    if (!resource) {
      throw new Error('That Spotify link is not a playlist, album, or track.')
    }
    const token = await getSpotifyToken()
    if (token) return fetchSpotifyViaApi(resource.type, resource.id, token)
    return fetchSpotifyViaEmbed(resource.type, resource.id)
  }

  if (isYoutubePlaylistUrl(resolved) || isYoutubePlaylistUrl(rawUrl)) {
    const listId = extractYoutubePlaylistId(resolved) || extractYoutubePlaylistId(rawUrl)
    if (!listId) {
      throw new Error('Could not find a YouTube playlist id in this link.')
    }
    if (/^RD/i.test(listId)) {
      throw new Error('YouTube Mix/radio links are not supported. Paste a real playlist URL (youtube.com/playlist?list=...).')
    }
    return fetchYoutubePlaylistTracks(listId)
  }

  throw new Error('This is not a YouTube playlist or Spotify playlist/album/track link.')
}
