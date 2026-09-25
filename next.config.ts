import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/ffmpeg-static/**/*'],
  },
  async redirects() {
    return [
      {
        source: '/apps/A2Z-Downloader.apk',
        destination: 'https://github.com/mrfreqline/unidownloader/releases/latest/download/A2Z-Downloader.apk',
        permanent: false,
      },
      {
        source: '/apps/A2Z-Downloader-Setup.exe',
        destination: 'https://github.com/mrfreqline/unidownloader/releases/latest/download/A2Z-Downloader-Setup.exe',
        permanent: false,
      },
    ]
  },
  experimental: {
    cpus: 4,
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

export default nextConfig