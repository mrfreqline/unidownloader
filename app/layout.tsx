import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UniDownloader — Universal Media Downloader',
  description: 'Fast, ephemeral media downloader and converter with zero server retention.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UniDownloader',
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
      <body className="antialiased overflow-x-hidden selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  )
}