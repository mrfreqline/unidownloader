import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/download', '/api/analyze'],
    },
    sitemap: 'https://a2zdownloader.vercel.app/sitemap.xml',
  }
}
