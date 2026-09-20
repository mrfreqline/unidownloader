import { NextRequest, NextResponse } from 'next/server'
import {
  fetchShareBoxFiles,
  fetchDirectFileUrl,
  formatBytes,
  FolderItem,
} from '@/lib/downloader/terabox-resolver'

export async function POST(req: NextRequest) {
  try {
    const { linkId, dirId = '', uid: passedUid = '' } = await req.json()

    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId parameter' }, { status: 400 })
    }

    const { user, files, uid } = await fetchShareBoxFiles(linkId, dirId)
    const effectiveUid = passedUid || uid || ''

    const folderItems: FolderItem[] = []

    for (const f of files) {
      const meta = f.file_meta || {}
      const isDir = Boolean(meta.type === 'DIRECTORY' || meta.directory || f.directory)
      const isVideo = Boolean(
        meta.video ||
        meta.extension === 'm3u8' ||
        meta.extension === 'mp4' ||
        meta.mime_type?.includes('video')
      )
      const fileId = f.id || f.file_id

      let streamUrl: string | undefined
      let downloadUrl: string | undefined

      if (!isDir && fileId) {
        const decrypted = await fetchDirectFileUrl(effectiveUid, fileId)
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

    return NextResponse.json({
      folderTitle: user?.name ? `${user.name}'s Shared Files` : 'Shared Folder',
      currentDirId: dirId,
      linkId,
      uid: effectiveUid,
      items: folderItems,
    })
  } catch (err: any) {
    console.error('[Folder Browse Error]:', err?.message || err)
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve folder contents' },
      { status: 500 }
    )
  }
}
