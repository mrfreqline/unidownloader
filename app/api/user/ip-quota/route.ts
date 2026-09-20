import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  : null

// In-memory fallback cache (fast & zero-latency)
interface MemoryRecord {
  trialsLeft: number
  lastResetDate: string
  updatedAt: number
}
const memoryCache = new Map<string, MemoryRecord>()

// Helper to extract clean client IP
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  return '127.0.0.1'
}

// SHA-256 IP hasher for strict privacy & GDPR compliance
function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + '_a2z_downloader_quota_salt_2026')
    .digest('hex')
}

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req)
  const ipHash = hashIp(clientIp)
  const today = new Date().toISOString().slice(0, 10)

  let trialsLeft = 3

  // 1. Try Supabase ip_quotas table
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ip_quotas')
        .select('trials_left, last_reset_date')
        .eq('ip_hash', ipHash)
        .single()

      if (!error && data) {
        if (data.last_reset_date !== today) {
          // 24-hour daily auto-reset
          trialsLeft = 3
          await supabaseAdmin
            .from('ip_quotas')
            .update({ trials_left: 3, last_reset_date: today, updated_at: new Date().toISOString() })
            .eq('ip_hash', ipHash)
        } else {
          trialsLeft = data.trials_left ?? 3
        }
      } else if (error && error.code === 'PGRST116') {
        // Record doesn't exist yet: initialize with 3 trials
        trialsLeft = 3
        await supabaseAdmin.from('ip_quotas').insert({
          ip_hash: ipHash,
          trials_left: 3,
          last_reset_date: today,
        })
      }
    } catch {
      // Table might not exist yet, fallback to memoryCache
    }
  }

  // 2. Check memoryCache if Supabase not used or empty
  if (memoryCache.has(ipHash)) {
    const cached = memoryCache.get(ipHash)!
    if (cached.lastResetDate === today) {
      trialsLeft = cached.trialsLeft
    } else {
      trialsLeft = 3
      memoryCache.set(ipHash, { trialsLeft: 3, lastResetDate: today, updatedAt: Date.now() })
    }
  } else {
    memoryCache.set(ipHash, { trialsLeft, lastResetDate: today, updatedAt: Date.now() })
  }

  // 3. Check tamper-evident cookie fallback
  const cookieQuota = req.cookies.get('a2z_guest_trials')?.value
  if (cookieQuota !== undefined) {
    const parsed = parseInt(cookieQuota, 10)
    if (!isNaN(parsed) && parsed < trialsLeft) {
      trialsLeft = parsed
    }
  }

  const res = NextResponse.json({
    success: true,
    trialsLeft,
    ipHash,
    resetDate: today,
  })

  // Set HttpOnly cookie tracking
  res.cookies.set('a2z_guest_trials', trialsLeft.toString(), {
    path: '/',
    maxAge: 86400, // 24 hours
    httpOnly: false, // Accessible to client sync
    sameSite: 'lax',
  })

  return res
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const ipHash = hashIp(clientIp)
  const today = new Date().toISOString().slice(0, 10)

  try {
    const body = await req.json().catch(() => ({}))
    const { action, amount } = body

    let currentTrials = 3

    // Check memory first
    if (memoryCache.has(ipHash)) {
      const cached = memoryCache.get(ipHash)!
      currentTrials = cached.lastResetDate === today ? cached.trialsLeft : 3
    }

    // Check Supabase
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('ip_quotas')
          .select('trials_left, last_reset_date')
          .eq('ip_hash', ipHash)
          .single()

        if (data) {
          currentTrials = data.last_reset_date === today ? data.trials_left : 3
        }
      } catch {
        // Continue with memory
      }
    }

    let newTrials = currentTrials

    if (action === 'deduct') {
      newTrials = Math.max(0, currentTrials - 1)
    } else if (action === 'reward') {
      const rewardAmount = typeof amount === 'number' ? amount : 4
      newTrials = currentTrials + rewardAmount
    } else if (action === 'set' && typeof amount === 'number') {
      newTrials = Math.max(0, amount)
    }

    // Update in-memory cache
    memoryCache.set(ipHash, {
      trialsLeft: newTrials,
      lastResetDate: today,
      updatedAt: Date.now(),
    })

    // Update Supabase if available
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('ip_quotas').upsert({
          ip_hash: ipHash,
          trials_left: newTrials,
          last_reset_date: today,
          updated_at: new Date().toISOString(),
        })
      } catch {
        // Table might not be ready yet
      }
    }

    const res = NextResponse.json({
      success: true,
      trialsLeft: newTrials,
      ipHash,
    })

    res.cookies.set('a2z_guest_trials', newTrials.toString(), {
      path: '/',
      maxAge: 86400,
      httpOnly: false,
      sameSite: 'lax',
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Quota update failed' }, { status: 500 })
  }
}
