import type { Metadata, Viewport } from 'next'
import './globals.css'

const SEO_KEYWORDS = [
  // Core Downloader
  'video downloader',
  'all video downloader',
  'video downloader online',
  'online video downloader',
  'free video downloader',
  'universal video downloader',
  'all in one downloader',
  'media downloader',
  'instant video downloader',
  'fast video downloader',
  'HD video downloader',
  'full HD video downloader',
  '4K video downloader',
  'video downloader MP4',
  'video downloader MP3',
  'high quality video downloader',
  // YouTube
  'YouTube downloader',
  'YouTube video downloader',
  'YouTube MP3 downloader',
  'YouTube MP4 downloader',
  'YouTube audio downloader',
  'YouTube to MP3',
  'YouTube to MP4',
  'convert YouTube to MP3',
  'YouTube thumbnail downloader',
  'YouTube 1080p downloader',
  'YouTube custom clip downloader',
  // TikTok
  'TikTok downloader',
  'TikTok video downloader',
  'TikTok downloader without watermark',
  'TikTok MP4 downloader',
  'TikTok audio downloader',
  'TikTok sound downloader',
  'TikTok photo downloader',
  'TikTok slideshow downloader',
  'TikTok to MP3',
  // Facebook
  'Facebook downloader',
  'Facebook video downloader',
  'Facebook reel downloader',
  'Facebook reels video download',
  'Facebook story downloader',
  'Facebook HD video downloader',
  'Facebook to MP4',
  // Instagram
  'Instagram downloader',
  'Instagram video downloader',
  'Instagram reel downloader',
  'Instagram photo downloader',
  'Instagram carousel downloader',
  'Instagram story downloader',
  'Instagram to MP4',
  // TeraBox & ShareBox
  'TeraBox downloader',
  'TeraBox video downloader',
  'TeraBox file downloader',
  'TeraBox direct download',
  'TeraBox link bypass',
  '1024tera video downloader',
  'ShareBox downloader',
  'ShareBox video downloader',
  'ShareBox file download',
  // Audio & MP3
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
  'high quality audio download',
  'extract mp3 from video',
  // MP4 & Quality
  'MP4 downloader',
  '1080p MP4 downloader',
  '720p MP4 downloader',
  'video quality selector',
  // Custom Clips & Trimming
  'custom video downloader',
  'custom audio downloader',
  'video clip downloader',
  'audio clip downloader',
  'start end video downloader',
  'video trimming downloader',
  'video cutter downloader',
  // Photos & Images
  'photo downloader',
  'image downloader',
  'thumbnail downloader',
  // Streaming & Usability
  'stream video online',
  'preview video online',
  'browser video downloader',
  'no software downloader',
  // Brand
  'A2Z Downloader',
  'a2z downloader',
  'A2Z video downloader',
  'A2Z all video downloader',
  'A2Z media downloader',
  'A2Z audio downloader',
  'A2Z MP3 downloader',
  'A2Z YouTube downloader',
  'A2Z TikTok downloader',
  'A2Z Instagram downloader',
  'A2Z Facebook downloader',
  'A2Z TeraBox downloader',
]

export const metadata: Metadata = {
  metadataBase: new URL('https://a2zdownloader.vercel.app'),
  title: 'A2Z Downloader – All Video & Audio Downloader | YouTube, TikTok, Facebook, Instagram, TeraBox & More',
  description:
    'A2Z Downloader is an all-in-one online video and audio downloader for YouTube, TikTok, Facebook, Instagram, TeraBox, ShareBox and more. Download videos, music, MP3, MP4, photos, thumbnails and custom video or audio clips with available HD and high-quality options.',
  keywords: SEO_KEYWORDS,
  applicationName: 'A2Z Downloader',
  authors: [{ name: 'A2Z Downloader', url: 'https://a2zdownloader.vercel.app' }],
  creator: 'A2Z Downloader',
  publisher: 'A2Z Downloader',
  category: 'technology',
  alternates: {
    canonical: 'https://a2zdownloader.vercel.app',
  },
  verification: {
    google: [
      'cgHoN6YlQzfxEnJT7ZKza1JljfExRX8CjszmOdZ793Q',
      '_C1SAePr9ENrRByLv317V6-vs11WKRs4xziVqcBp54c',
    ],
  },
  openGraph: {
    title: 'A2Z Downloader – All Video & Audio Downloader | YouTube, TikTok, Facebook, Instagram, TeraBox & More',
    description:
      'A2Z Downloader is an all-in-one online video and audio downloader for YouTube, TikTok, Facebook, Instagram, TeraBox, ShareBox and more. Download videos, music, MP3, MP4, photos, thumbnails and custom video or audio clips with available HD and high-quality options.',
    url: 'https://a2zdownloader.vercel.app',
    siteName: 'A2Z Downloader',
    images: [
      {
        url: '/logo-icon.jpg',
        width: 512,
        height: 512,
        alt: 'A2Z Downloader Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A2Z Downloader – All Video Downloader | TikTok, FB, Instagram, TeraBox, ShareBox & YouTube',
    description:
      'A2Z Downloader is an all-in-one online video and audio downloader for YouTube, TikTok, Facebook, Instagram, TeraBox, ShareBox and more. Download videos, music, MP3, MP4, photos, thumbnails and custom clips.',
    images: ['/logo-icon.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logo-icon.jpg',
    shortcut: '/logo-icon.jpg',
    apple: '/logo-icon.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'A2Z Downloader',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://a2zdownloader.vercel.app/#website',
      url: 'https://a2zdownloader.vercel.app/',
      name: 'A2Z Downloader',
      description: 'Free Online All-in-One Video, Audio, MP3 & MP4 Downloader',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://a2zdownloader.vercel.app/?url={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://a2zdownloader.vercel.app/#app',
      name: 'A2Z Downloader',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'All',
      url: 'https://a2zdownloader.vercel.app/',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'YouTube Video & Audio MP3 320kbps Downloader',
        'TikTok Video Downloader Without Watermark & Photo Slides',
        'Instagram Reels, Video, Photo & Carousel Downloader',
        'Facebook Video & Reels Downloader in 1080p Full HD',
        'TeraBox & ShareBox Direct Link Generator & Folder Explorer',
        'Custom Video & Audio Clip Trimming with Start/End Times',
        'High Resolution Photo and Video Thumbnail Saver',
        'In-Browser Video Streaming Player',
        '100% Free with Zero Server File Retention',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://a2zdownloader.vercel.app/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is A2Z Downloader?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A2Z Downloader is a free online all-in-one media downloader that brings multiple download tools together in one place. Download videos and audio from supported platforms including YouTube, TikTok, Facebook, Instagram, TeraBox and ShareBox. Choose available video quality and audio options such as 128kbps, 192kbps, 320kbps and Studio HD, download MP3 or MP4, save photos and thumbnails, create custom MP3 or MP4 clips using start and end times, and stream supported media directly online.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I download TikTok videos without watermark?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Copy the TikTok video link from the TikTok mobile app or web browser, paste it into the A2Z Downloader search box, and click Inspect. Our engine strips watermarks automatically and delivers crystal-clear Full HD MP4 downloads alongside high-bitrate MP3 audio extraction and photo slideshow downloads.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I download Instagram Reels, Videos, Photos, and Carousels?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! A2Z Downloader fully supports Instagram Reels, standard feed videos, high-resolution photo posts, IGTV, and multi-slide carousel albums. You can inspect any Instagram post to download individual images, albums, or HD video clips with zero compression.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I download Facebook videos and FB Reels in 1080p HD?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Copy the URL of any public Facebook video, Watch clip, story, or Facebook Reel. Paste the link into A2Z Downloader and select your preferred MP4 resolution up to 1080p Full HD. You can also extract the audio track directly as an MP3 file.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I download YouTube videos and convert to 320kbps MP3 audio?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Paste any YouTube video or Shorts URL into the input field. A2Z Downloader allows you to download video in resolutions from 360p, 480p, 720p, 1080p up to 4K MP4. If you only want the sound, switch to Audio mode to extract studio-quality MP3 at 128kbps, 192kbps, or 320kbps Studio HD bitrate.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does TeraBox and ShareBox direct download bypass work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Paste any TeraBox, 1024Tera, or ShareBox link into A2Z Downloader. Our platform connects to the file sharing handshake, parses the folder contents and file sizes, and generates direct download links at maximum bandwidth. You can even stream videos directly in your browser without installing the TeraBox application.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I cut or trim custom video or audio clips before downloading?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! A2Z Downloader features a built-in Media Enhancer that allows you to specify custom start and end timestamps. You can clip a 30-second music ringtone from a long song or isolate an exact highlight section from an hour-long video without downloading the entire large file.',
          },
        },
        {
          '@type': 'Question',
          name: 'What video qualities and audio bitrates are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For video, A2Z Downloader provides MP4 downloads in 360p, 480p, 720p HD, 1080p Full HD, and 4K UHD depending on the source platform. For audio, you can choose flexible MP3 bitrates including 128kbps (standard), 192kbps (high fidelity), and 320kbps (Studio HD audio).',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I download photo posts and video thumbnails?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. You can download high-resolution cover photos, video thumbnails (including original YouTube maximum-resolution thumbnails), TikTok photo carousels, and Instagram photo posts directly in JPEG and PNG formats.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I stream and preview videos before downloading?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A2Z Downloader includes an integrated in-browser video and audio player. You can preview, listen to, or stream media directly before committing to a download, ensuring you get the exact content and quality you want.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to install software, browser extensions, or create an account?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No! A2Z Downloader is 100% web-based and runs entirely in your modern browser on Android, iPhone, iPad, Windows PC, Mac, and Linux. No software installation, browser extensions, or account registration are required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is A2Z Downloader safe, private, and free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A2Z Downloader is completely free to use. All media requests are processed ephemerally with zero permanent file retention on our servers. Your downloads and browsing sessions remain strictly private and secure.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <meta name="google-site-verification" content="cgHoN6YlQzfxEnJT7ZKza1JljfExRX8CjszmOdZ793Q" />
        <meta name="google-site-verification" content="_C1SAePr9ENrRByLv317V6-vs11WKRs4xziVqcBp54c" />
        <meta name="keywords" content={SEO_KEYWORDS.join(', ')} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* PWA Manifest & Mobile Capability */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Google Fonts: Space Grotesk (headings) & Inter (body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Universal Theme Synchronizer: Ensures dark/light mode matches everywhere */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('unidownloader_theme') || 'dark';
                if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  )
}