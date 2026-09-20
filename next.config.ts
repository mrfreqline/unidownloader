import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/ffmpeg-static/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

export default nextConfig