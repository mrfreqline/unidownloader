# 🚀 A2Z Downloader - Universal Media Downloader & Studio Editor

[![Release](https://img.shields.io/github/v/release/mrfreqline/unidownloader?color=emerald&label=Latest%20Release)](https://github.com/mrfreqline/unidownloader/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%20PC%20%7C%20Android%20%7C%20Web-blue)](https://github.com/mrfreqline/unidownloader/releases/latest)
[![License](https://img.shields.io/badge/License-100%25%20Free-brightgreen)](#)
[![Engine](https://img.shields.io/badge/Engine-yt--dlp%20%2B%20FFmpeg-orange)](#)

> **A2Z Downloader** is a high-speed, 100% free universal media downloader and video studio editor for Windows PC, Android, and Web. Download videos in 4K Ultra HD, extract 320kbps MP3s, and create 9:16 vertical short-form clips with animated kinetic subtitles (Alex Hormozi, TikTok Viral, and Neon styles).

---

## ⚡ How to Run & Set Up A2Z Downloader

### Option 1: Direct Run (No Installation Required)
* **Desktop Launcher**: Double-click `Run-A2Z.bat` or `A2Z Downloader.lnk` on your Desktop.
* **Direct Executable**: Run `A2Z Downloader.exe` directly from:
  ```
  dist\win-unpacked\A2Z Downloader.exe
  ```
* Starts in **1 second** with bundled local `yt-dlp` and `FFmpeg` hardware engines.

### Option 2: Windows Installer (.EXE)
1. Download the latest installer from [GitHub Releases](https://github.com/mrfreqline/unidownloader/releases/latest):
   - **`A2Z-Downloader-Setup.exe`**
2. Double-click to install. It installs to your PC and creates a start menu and desktop shortcut.

### Option 3: Android Phone (.APK)
1. Download **`A2Z-Downloader.apk`** from [GitHub Releases](https://github.com/mrfreqline/unidownloader/releases/latest).
2. Install on your Android phone and download directly to your mobile gallery.

### Option 4: Web Browser (Online)
* Visit [https://a2zdownloader.vercel.app](https://a2zdownloader.vercel.app) from any browser (Chrome, Brave, Edge, Safari).

---

## 📥 How to Download Videos & Audio (Step by Step)

1. **Copy Link**: Copy any media link from YouTube, TikTok, Facebook, Instagram, Twitter/X, TeraBox, or direct video URLs.
2. **Paste & Analyze**: Paste the link into the search bar and press **Enter** (or click the search button).
   - In the Desktop App, analysis completes in **~1.5 seconds** via the native local engine.
3. **Select Format & Quality**:
   - 🌟 **4K Ultra HD (2160p)** / **2K Quad HD (1440p)**: Maximum quality with zero cloud caps.
   - 🎬 **1080p Full HD** / **720p HD**: High quality with fast rendering.
   - 🎵 **Audio Only (MP3)**: Extracts high-fidelity 320kbps audio.
4. **Click Download**:
   - The video is saved directly to your **Downloads** folder.
   - On the Desktop App, downloads automatically leverage your PC's multi-threaded network speed without browser timeouts.

---

## ✂️ How to Clip & Make Shorts in Studio Mode (Step by Step)

A2Z Downloader includes a built-in **Studio Video Editor** for turning long-form videos into viral short-form clips:

1. **Open in Studio**:
   - On the video card, click **`✂️ Render Clip & Edit`** (or go to the **Studio Editor** tab).
2. **Choose Aspect Ratio**:
   - **`9:16`**: Optimized for TikTok, YouTube Shorts, and Instagram Reels (with smart blurred side padding or center crop).
   - **`16:9`**: Standard widescreen for YouTube and desktop presentations.
   - **`1:1`**: Square format for Instagram posts and LinkedIn.
3. **Set Clip Markers (Trim)**:
   - Drag the timeline handles or set the Start Time and Duration (e.g., 30s or 60s).
4. **Add Kinetic Subtitles**:
   - Toggle **Kinetic Captions** on.
   - Choose your viral subtitle preset:
     - 🟡 **Alex Hormozi Pop-In**: Bold yellow text on a dark badge with punchy black borders.
     - ⚪ **TikTok Viral**: Clean white font with heavy black stroke.
     - 🔵 **Cyberpunk Neon**: Glowing cyan futuristic subtitle box.
     - 🔴 **Crimson Impact**: Bold red accent font.
5. **Add Headline Banner**:
   - Type your hook or headline in the **Headline Banner** field (e.g., *"Wait until the end 😱"*).
6. **Apply Color Presets**:
   - Choose from *Vibrant*, *Cinema*, *Vintage*, or *Black & White* shader filters.
7. **Render & Export**:
   - Click **`Render & Export Video (MP4)`**.
   - Your custom clip is rendered and saved to your PC's **Downloads** folder.

---

## 💡 Why the Desktop App is Faster & 100% Free

* **Local Hardware Processing**: Cloud servers have bandwidth quotas and serverless execution timeouts. The A2Z Downloader desktop app runs `yt-dlp` and `FFmpeg` directly on your computer's CPU/GPU, giving you **unlimited duration** and **unlimited resolution**.
* **Zero Subscription Fees**: No monthly credits, no tokens required on PC, and no watermarks.

---

## 🛠️ Building & Running from Source

```bash
# 1. Clone the repository
git clone https://github.com/mrfreqline/unidownloader.git
cd unidownloader

# 2. Install dependencies
npm install

# 3. Run development web server
npm run dev

# 4. Package Windows .EXE installer & standalone binary
npm run build:exe
```

---

## 📄 License
This project is open-source and free to use.
