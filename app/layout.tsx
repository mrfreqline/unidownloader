import type { Metadata, Viewport } from 'next'
import './globals.css'

const SEO_KEYWORDS = [
  'tiktok video downloader',
  'tiktok downloader without watermark',
  'download tiktok video',
  'tiktok to mp4',
  'tiktok mp3 download',
  'tiktok saver',
  'snaptik alternative',
  'ssstik alternative',
  'facebook video downloader',
  'fb video download',
  'fb reel downloader',
  'facebook reel download',
  'download fb watch videos',
  'facebook to mp4',
  'fb story downloader',
  'instagram video downloader',
  'instagram reel downloader',
  'download instagram stories',
  'ig video save',
  'instagram to mp4',
  'savefrom instagram',
  'youtube video downloader',
  'youtube to mp4',
  'youtube to mp3',
  'download youtube 1080p',
  'youtube 4k video downloader',
  'youtube audio ripper',
  'twitter video downloader',
  'x video downloader',
  'download twitter video',
  'save twitter video',
  'twitter to mp4',
  'terabox video downloader',
  'terabox direct download',
  'terabox link bypass',
  '1024tera video downloader',
  '1024terabox download',
  'sharebox video downloader',
  'vividcast video downloader',
  'terabox online player',
  'terabox folder download',
  'reddit video downloader',
  'reddit video with sound',
  'twitch clip downloader',
  'pinterest video downloader',
  'vimeo video downloader',
  'universal video downloader',
  'all in one video downloader',
  'all video downloader',
  'free video downloader online',
  'download any video from link',
  'url to mp4 downloader',
  'online video converter',
  'fast video saver',
  'hd video downloader',
  '4k video downloader',
  'mp4 video downloader free',
  'extract mp3 from video',
  'audio extractor online',
  'save video online free',
  'mobile video downloader',
  'no watermark video downloader',
  'social media video downloader',
  'best video downloader 2026',
  'a2z downloader',
  'unidownloader',
  'download streaming video',
  'browser video downloader',
  'online media saver',
  'fast mp4 downloader',
]

export const metadata: Metadata = {
  metadataBase: new URL('https://a2zdownloader.vercel.app'),
  title: 'A2Z Downloader — All Video Downloader | TikTok, FB, Insta, TeraBox & YouTube',
  description:
    'Free all-in-one universal video downloader. Download any video, reel, story, or audio from TikTok (no watermark), Facebook, Instagram, YouTube, TeraBox, Twitter/X, Reddit, and direct URLs in HD and 4K with zero retention.',
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
    title: 'A2Z Downloader — Free Universal Video Downloader',
    description:
      'Download any video, reel, story, or audio from TikTok (without watermark), Facebook, Instagram, YouTube, TeraBox, Twitter/X in HD & MP3. 100% Free & Fast.',
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
    title: 'A2Z Downloader — All Video Downloader (TikTok, FB, Insta, TeraBox)',
    description:
      'Fast 1-click video downloader for TikTok, Facebook, Instagram, YouTube, TeraBox, and direct links. No watermark, high quality.',
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
      description: 'Free All-in-One Online Video Downloader and Audio Extractor',
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
        'TikTok Video Downloader Without Watermark',
        'Facebook Reel and Video Downloader',
        'Instagram Reel and Story Downloader',
        'TeraBox and 1024Tera Bypass and Downloader',
        'YouTube to MP4 and MP3 Extractor',
        'Twitter/X Video Downloader',
        'Zero Retention Ephemeral Streaming',
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
        {/* Adsterra SocialBar */}
        <script
          async
          src="https://pl31434136.profitableratecpmnetwork.com/aa/6d/e9/aa6de9c30e965976a5448d3827e285f6.js"
        />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  )
}