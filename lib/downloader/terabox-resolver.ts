import crypto from 'crypto'
import { StreamResult } from './stream-resolver'

const AES_KEY = 'CMrhmcd9oFUjWBBleiMfS0BiBfupaVsG'
const AES_IV = '2Xk4dLo38c9Z2Q2a'
const API_BASE = 'https://api.cshsnpcwio.com'

export interface FolderItem {
  id: string
  name: string
  isDir: boolean
  size?: string
  sizeBytes?: number
  thumbnail?: string
  isVideo?: boolean
  mimeType?: string
  extension?: string
  streamUrl?: string
  downloadUrl?: string
}

export interface FolderResult {
  isFolder: true
  folderTitle: string
  platform: string
  linkId: string
  uid?: string
  currentDirId?: string
  items: FolderItem[]
}

// Decrypt AES-256-CBC ciphertext returned by Vividcast / ShareBox API
export function decryptUrl(ciphertextBase64: string): string | null {
  if (!ciphertextBase64) return null
  try {
    const key = Buffer.from(AES_KEY, 'utf8')
    const iv = Buffer.from(AES_IV, 'utf8')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(ciphertextBase64.trim(), 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('[Decryption Error]:', err)
    return null
  }
}

// Format raw bytes into human-readable size
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

// Check if a URL belongs to TeraBox, ShareBox, or Vividcast
export function isTeraBoxOrShareBoxUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.includes('vividcast') ||
    lower.includes('sharebox') ||
    lower.includes('terabox') ||
    lower.includes('1024tera') ||
    lower.includes('terashare') ||
    lower.includes('cashsnap') ||
    lower.includes('cshsnpcwio') ||
    lower.includes('linkid=') ||
    lower.includes('link_id=')
  )
}

// Extract linkId from various URL patterns
export function extractLinkId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const linkId =
      parsed.searchParams.get('linkId') ||
      parsed.searchParams.get('linkid') ||
      parsed.searchParams.get('link_id') ||
      parsed.searchParams.get('cashiered') ||
      parsed.searchParams.get('edit')

    if (linkId) return linkId

    // Check inside adj_deep_link parameter if encoded
    const adjDeep = parsed.searchParams.get('adj_deep_link')
    if (adjDeep) {
      const deepParsed = new URL(decodeURIComponent(adjDeep).replace(/^sharebox:\/\//, 'https://sharebox.com/'))
      const deepId =
        deepParsed.searchParams.get('cashiered') ||
        deepParsed.searchParams.get('linkId') ||
        deepParsed.searchParams.get('link_id')
      if (deepId) return deepId
    }

    // Check regex in entire string
    const match = url.match(/(?:linkId|linkid|link_id|cashiered)=([0-9a-zA-Z_-]+)/i)
    if (match && match[1]) return match[1]

    return null
  } catch {
    const match = url.match(/(?:linkId|linkid|link_id|cashiered)=([0-9a-zA-Z_-]+)/i)
    return match ? match[1] : null
  }
}

// Extract TeraBox shorturl key
export function extractTeraBoxKey(url: string): string | null {
  try {
    const match = url.match(/(?:\/s\/1|\/s\/|surl=)([0-9a-zA-Z_-]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Fetch files from Vividcast / ShareBox API
export async function fetchShareBoxFiles(
  linkId: string,
  dirId: string = ''
): Promise<{ user?: any; files: any[]; uid?: string }> {
  const payload = {
    uid: '',
    dir_id: dirId && dirId.length > 8 ? dirId : '',
    link_id: linkId,
    open_link: true,
    page_size: 50,
    current_page: 1,
  }

  const res = await fetch(`${API_BASE}/v1/h5_open_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': `https://www.vividcastydca.com/?linkId=${linkId}`,
      'Origin': 'https://www.vividcastydca.com',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`ShareBox API returned HTTP ${res.status}`)
  }

  const data = await res.json()
  const user = data?.data?.user || data?.user
  const uid = user?.id || ''
  const files = data?.data?.files || data?.files || []

  return {
    user,
    files,
    uid,
  }
}

// Fetch and decrypt direct file URL
export async function fetchDirectFileUrl(uid: string, fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/h5/download_file_url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        uid: uid || '',
        file_id: fileId,
      }),
    })

    if (!res.ok) return null
    const textCipher = await res.text()
    if (!textCipher) return null

    return decryptUrl(textCipher)
  } catch (err) {
    console.error('[Download URL fetch error]:', err)
    return null
  }
}

// Main Resolver for TeraBox and ShareBox
export async function resolveTeraBoxOrShareBox(
  url: string,
  targetDirId: string = ''
): Promise<(StreamResult & { folderData?: FolderResult }) | null> {
  const linkId = extractLinkId(url)

  // A. If it has a ShareBox / Vividcast linkId
  if (linkId) {
    try {
      const { user, files, uid } = await fetchShareBoxFiles(linkId, targetDirId)

      if (!files || files.length === 0) {
        throw new Error('This share link has expired or has no accessible files.')
      }

      const folderItems: FolderItem[] = []

      // Process and decrypt URLs for files
      for (const f of files) {
        const meta = f.file_meta || {}
        const isDir = Boolean(meta.type === 'DIRECTORY' || meta.directory || f.directory)
        const isVideo = Boolean(meta.video || meta.extension === 'm3u8' || meta.extension === 'mp4' || meta.mime_type?.includes('video'))
        const fileId = f.id || f.file_id

        let streamUrl: string | undefined
        let downloadUrl: string | undefined

        // Pre-decrypt file download/stream URLs
        if (!isDir && fileId) {
          const decrypted = await fetchDirectFileUrl(uid || '', fileId)
          if (decrypted) {
            streamUrl = decrypted
            downloadUrl = decrypted
          }
        }

        folderItems.push({
          id: fileId,
          name: meta.display_name || f.name || 'Untitled File',
          isDir,
          size: meta.size ? formatBytes(meta.size) : isDir ? 'Folder' : '',
          sizeBytes: meta.size || 0,
          thumbnail: meta.thumbnail || '',
          isVideo,
          mimeType: meta.mime_type || '',
          extension: meta.extension || '',
          streamUrl,
          downloadUrl,
        })
      }

      // Identify primary item (first video or first file)
      const primaryFile = folderItems.find(i => !i.isDir && i.isVideo) || folderItems.find(i => !i.isDir) || folderItems[0]

      const title =
        files.length === 1 && primaryFile
          ? primaryFile.name
          : user?.name
          ? `${user.name}'s Shared Files`
          : 'ShareBox Collection'

      const primaryDownloadUrl = primaryFile?.downloadUrl || primaryFile?.streamUrl || url

      const folderData: FolderResult = {
        isFolder: true,
        folderTitle: title,
        platform: 'ShareBox / Vividcast',
        linkId,
        uid,
        currentDirId: targetDirId,
        items: folderItems,
      }

      return {
        title,
        thumbnail: primaryFile?.thumbnail || user?.picture || '',
        platform: 'ShareBox / Vividcast',
        qualities: ['Original Quality', 'HD Stream', 'Audio Only'],
        streamUrl: primaryFile?.streamUrl || primaryDownloadUrl,
        downloadUrl: primaryDownloadUrl,
        isDirectMovie: true,
        fileSize: primaryFile?.size || `${folderItems.length} items`,
        uploader: user?.name || 'ShareBox User',
        folderData,
      }
    } catch (err: any) {
      console.error('[ShareBox Resolver Error]:', err)
      throw new Error(err?.message || 'Unable to resolve ShareBox files. Check the link and try again.')
    }
  }

  // B. TeraBox Standard shorturl fallback (terabox.com / 1024tera.com)
  const teraKey = extractTeraBoxKey(url)
  if (teraKey) {
    try {
      // Use multi-tier open Terabox API proxies
      const apiEndpoints = [
        `https://terabox-api.graydeveloper.com/api?url=${encodeURIComponent(url)}`,
        `https://yt-streamer.onrender.com/terabox?url=${encodeURIComponent(url)}`,
      ]

      for (const ep of apiEndpoints) {
        try {
          const res = await fetch(ep, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            signal: AbortSignal.timeout(6000),
          })
          if (!res.ok) continue
          const data = await res.json()

          const fileList = data?.list || data?.files || (data?.download_link ? [data] : [])
          if (fileList.length > 0) {
            const folderItems: FolderItem[] = fileList.map((item: any, idx: number) => {
              const name = item.filename || item.server_filename || item.title || `File_${idx + 1}`
              const isDir = Boolean(item.isdir === 1 || item.is_dir)
              const dlink = item.download_link || item.dlink || item.direct_link || item.url
              const size = item.size ? formatBytes(Number(item.size)) : ''

              return {
                id: item.fs_id || String(idx),
                name,
                isDir,
                size,
                sizeBytes: Number(item.size) || 0,
                thumbnail: item.thumb || item.thumbnail || '',
                isVideo: name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.webm'),
                streamUrl: dlink,
                downloadUrl: dlink,
              }
            })

            const first = folderItems.find(i => !i.isDir) || folderItems[0]
            const title = first?.name || 'TeraBox Shared Collection'

            return {
              title,
              thumbnail: first?.thumbnail || '',
              platform: 'TeraBox',
              qualities: ['Original Quality', 'High Speed', 'Audio Only'],
              streamUrl: first?.streamUrl || first?.downloadUrl || url,
              downloadUrl: first?.downloadUrl || url,
              isDirectMovie: Boolean(first?.isVideo),
              fileSize: first?.size || `${folderItems.length} items`,
              uploader: 'TeraBox User',
              folderData: {
                isFolder: true,
                folderTitle: title,
                platform: 'TeraBox',
                linkId: teraKey,
                items: folderItems,
              },
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn('[TeraBox Fallback Error]:', err)
    }
  }

  return null
}
