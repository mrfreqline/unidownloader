import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Online MP3 & Audio Downloader | 320kbps Studio HD - A2Z Downloader',
  description:
    'Free online MP3 & audio downloader. Convert YouTube, TikTok, Facebook, and Instagram to 320kbps Studio HD MP3, 192kbps, or 128kbps audio. Extract music tracks, ringtones, and custom audio clips instantly.',
  keywords: [
    'MP3 downloader',
    'free MP3 downloader',
    'audio downloader',
    'music downloader',
    'song downloader',
    '320kbps MP3 downloader',
    '320 kbps MP3',
    '192kbps MP3',
    '128kbps MP3',
    'Studio HD audio',
    'studio quality audio',
    'high quality audio download',
    'YouTube to MP3',
    'YouTube MP3 downloader',
    'convert YouTube to MP3',
    'TikTok audio downloader',
    'TikTok sound downloader',
    'audio clip downloader',
    'custom audio downloader',
    'A2Z Downloader MP3',
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
