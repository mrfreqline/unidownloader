const fs = require('fs')
const path = require('path')

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const OWNER = 'mrfreqline'
const REPO = 'unidownloader'
const TAG = 'v2.1.0'

async function publish() {
  console.log('🚀 Creating GitHub Release ' + TAG + '...')

  const releasePayload = {
    tag_name: TAG,
    target_commitish: 'main',
    name: 'A2Z Downloader v2.1.0 - Native 4K Ultra HD & Studio Video Editor',
    body: `## 🚀 A2Z Downloader v2.1.0 - Major Release

### ✨ Highlights & New Features
- ⚡ **Native Engine 0 Integration**: Bundled local \`yt-dlp\` engine natively solves YouTube's latest JavaScript challenge (\`[jsc:node]\`) in under 1.5s.
- 🎬 **Studio Video Editor**: Resolved black canvas screen and CORS issues with high-performance direct video streaming and synchronized audio timeline playback.
- 🌟 **Ultra HD 4K & High Bitrate**: Direct progressive HTTPS MP4 stream selection up to 4K (2160p) with no buffering or limits.
- ✂️ **Short-Form Clip Maker**: 60s clips, kinetic subtitles (Hormozi, TikTok viral, Cyberpunk Neon), and 9:16 vertical exports.
- 🆓 **100% Free Forever**: Zero subscription required for unlimited PC processing.

### 📦 Downloads
- **Windows PC (.EXE Standalone Setup)**: \`A2Z-Downloader-Setup.exe\`
- **Android Phone (.APK)**: \`A2Z-Downloader.apk\`
`,
    draft: false,
    prerelease: false,
  }

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NodeJS',
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify(releasePayload),
  })

  let releaseData = await res.json()
  if (!res.ok) {
    if (releaseData.errors?.some(e => e.code === 'already_exists')) {
      console.log('Release already exists, fetching existing release...')
      const existingRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`, {
        headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'NodeJS' }
      })
      releaseData = await existingRes.json()
    } else {
      console.error('Failed to create release:', releaseData)
      process.exit(1)
    }
  }

  console.log(`✅ Release created: ${releaseData.html_url}`)
  console.log(`Upload URL template: ${releaseData.upload_url}`)

  const uploadUrlRaw = releaseData.upload_url.split('{')[0]

  // Assets to upload
  const assets = [
    {
      name: 'A2Z-Downloader-Setup.exe',
      filePath: path.join(__dirname, '..', 'dist', 'A2Z Downloader Setup 2.0.0.exe'),
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      name: 'A2Z-Downloader.apk',
      filePath: path.join(__dirname, '..', 'public', 'apps', 'A2Z-Downloader.apk'),
      contentType: 'application/vnd.android.package-archive',
    },
  ]

  for (const asset of assets) {
    if (!fs.existsSync(asset.filePath)) {
      console.warn(`File not found: ${asset.filePath}`)
      continue
    }

    const stat = fs.statSync(asset.filePath)
    console.log(`\n📦 Uploading ${asset.name} (${(stat.size / (1024 * 1024)).toFixed(1)} MB)...`)

    // Check if asset already exists in release
    const existingAsset = releaseData.assets?.find(a => a.name === asset.name)
    if (existingAsset) {
      console.log(`Asset ${asset.name} already exists. Deleting older asset ID ${existingAsset.id}...`)
      await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'NodeJS' }
      })
    }

    const uploadUrl = `${uploadUrlRaw}?name=${encodeURIComponent(asset.name)}`
    const fileStream = fs.createReadStream(asset.filePath)

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': asset.contentType,
        'Content-Length': String(stat.size),
        'User-Agent': 'NodeJS',
      },
      body: fileStream,
      duplex: 'half',
    })

    if (uploadRes.ok) {
      const upData = await uploadRes.json()
      console.log(`🎉 Successfully uploaded ${asset.name}! Direct link: ${upData.browser_download_url}`)
    } else {
      const err = await uploadRes.text()
      console.error(`❌ Upload failed for ${asset.name}:`, err)
    }
  }

  console.log('\n🏁 GitHub Release process complete!')
}

publish().catch(console.error)
