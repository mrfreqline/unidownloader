import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'A2Z Downloader — Download Media. Simple & Fast.',
  description: 'Download any video, movie, or audio in the world from TikTok, Instagram, YouTube, Facebook, Twitter/X, TeraBox, and direct links. Fast and simple with zero retention.',
  verification: {
    google: [
      'cgHoN6YlQzfxEnJT7ZKza1JljfExRX8CjszmOdZ793Q',
      '_C1SAePr9ENrRByLv317V6-vs11WKRs4xziVqcBp54c',
    ],
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
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  )
}