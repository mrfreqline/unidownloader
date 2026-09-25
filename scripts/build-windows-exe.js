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
  execSync('npx electron-builder --win --x64 -c.extraMetadata.main=electron-main.js', { stdio: 'inherit' })
  console.log('\n🎉 SUCCESS! Windows Setup file created inside the `dist/` directory!')
  console.log('Look for: dist/A2Z-Downloader-Setup.exe')

  const distExe = path.join(__dirname, '..', 'dist', 'A2Z-Downloader-Setup.exe')
  const publicAppsDir = path.join(__dirname, '..', 'public', 'apps')
  const targetExe = path.join(publicAppsDir, 'A2Z-Downloader-Setup.exe')

  if (fs.existsSync(distExe)) {
    if (!fs.existsSync(publicAppsDir)) {
      fs.mkdirSync(publicAppsDir, { recursive: true })
    }
    fs.copyFileSync(distExe, targetExe)
    console.log('✅ Successfully copied fresh build to public/apps/A2Z-Downloader-Setup.exe for web downloads!\n')
  }
} catch (e) {
  console.log('\n💡 Tip: To build portable/setup EXE anytime on Windows, run:')
  console.log('   npx electron-builder --win -c.extraMetadata.main=electron-main.js\n')
}
