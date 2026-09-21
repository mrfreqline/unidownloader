import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fast MP3 Downloader | Convert Video to 320kbps MP3 Online - A2Z Downloader',
  description:
    'Free, fast, and unlimited online MP3 downloader. Convert YouTube, TikTok, Instagram, Facebook, and SoundCloud videos to high-quality 320kbps MP3 audio in 1-click. No software or registration required.',
  keywords: [
    'mp3 downloader',
    'youtube to mp3',
    'fast mp3 downloader',
    'convert video to mp3',
    'tiktok mp3 download',
    'instagram audio download',
    '320kbps mp3',
    'high quality audio downloader',
    'free mp3 converter',
    'online audio extractor',
    'soundcloud to mp3',
  ],
  alternates: {
    canonical: 'https://a2zdownloader.vercel.app/mp3',
  },
  openGraph: {
    title: 'Fast MP3 Downloader | 320kbps High Quality Audio Converter',
    description:
      'Convert and download any video to crystal-clear 320kbps MP3 audio in seconds. 100% Free & Unlimited.',
    url: 'https://a2zdownloader.vercel.app/mp3',
    siteName: 'A2Z Downloader',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fast MP3 Downloader | Convert Video to MP3',
    description:
      'High-speed MP3 converter for YouTube, TikTok, Instagram, and more. 100% Free & Unlimited.',
  },
}

export default function Mp3Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
