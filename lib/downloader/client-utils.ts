// Pure client-safe utility functions with ZERO Node.js runtime dependencies (no fs, dns, child_process)
// Safe to import in React client components ('use client')

export function extractYouTubeVideoId(url: string): string | null {
  try {
    if (!url) return null
    const trimmed = url.trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^["']|["']$/g, '')
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|watch|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
    const match = trimmed.match(regex)
    if (match && match[1]) return match[1]

    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
      const v = parsed.searchParams.get('v')
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    } catch {}

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
    return null
  } catch {
    return null
  }
}
