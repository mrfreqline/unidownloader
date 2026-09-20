import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/ffmpeg-static/**/*'],
  },
  experimental: {
    cpus: 4,
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

export default nextConfig