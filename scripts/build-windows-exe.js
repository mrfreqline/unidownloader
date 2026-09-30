/**
 * A2Z Downloader - Windows .EXE Setup Generator Script
 * Packages the Next.js web application into a native Windows Standalone .exe Installer
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('====================================================')
console.log('🚀 A2Z Downloader - Windows .EXE Setup Packaging')
console.log('====================================================\n')

// Ensure bin/ directory has yt-dlp.exe and ffmpeg.exe
const rootDir = path.join(__dirname, '..')
const binDir = path.join(rootDir, 'bin')
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true })
}

// 1. Check/copy ffmpeg.exe
const binFfmpeg = path.join(binDir, 'ffmpeg.exe')
if (!fs.existsSync(binFfmpeg)) {
  try {
    const ffmpegStatic = require('ffmpeg-static')
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
      console.log('📦 Copying ffmpeg.exe to bin/ ...')
      fs.copyFileSync(ffmpegStatic, binFfmpeg)
    }
  } catch {
    console.log('⚠️ ffmpeg-static not found.')
  }
}

// 2. Check/download yt-dlp.exe
const binYtDlp = path.join(binDir, 'yt-dlp.exe')
if (!fs.existsSync(binYtDlp)) {
  console.log('📦 Downloading yt-dlp.exe to bin/ ...')
  try {
    execSync('curl.exe -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -o "' + binYtDlp + '"', { stdio: 'inherit' })
  } catch (err) {
    console.warn('⚠️ Could not download yt-dlp.exe automatically. Please place it in bin/yt-dlp.exe')
  }
}

// Check if electron is available
try {
  require.resolve('electron')
  console.log('✅ Electron found.')
} catch {
  console.log('📦 Installing Electron & Electron-Builder for Windows .exe generation...')
  try {
    execSync('npm install --save-dev electron electron-builder', { stdio: 'inherit' })
  } catch (err) {
    console.error('⚠️ Could not automatically install electron. Run: npm install --save-dev electron electron-builder')
  }
}

console.log('\n🔨 Packaging Windows Standalone Setup Executable...')
try {
  execSync(`npx electron-builder --win --x64 -c.extraMetadata.main=electron-main.js`, { stdio: 'inherit' })
  console.log('\n🎉 SUCCESS! Windows Setup file created inside the `dist/` directory!')

  const distDir = path.join(__dirname, '..', 'dist')
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir)
    const setupFile = files.find(f => f.endsWith('.exe') && f.toLowerCase().includes('setup'))
    if (setupFile) {
      console.log(`✅ Production Installer ready: dist/${setupFile}`)
    }
  }
} catch (e) {
  console.log('\n💡 Tip: To build portable/setup EXE anytime on Windows, run:')
  console.log('   npx electron-builder --win -c.extraMetadata.main=electron-main.js\n')
}
