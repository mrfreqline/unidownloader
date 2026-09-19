import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  : null

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace(/^Bearer\s+/i, '')

    let userId: string | null = null

    if (token) {
      const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
      if (!authErr && user) {
        userId = user.id
      }
    }

    const body = await req.json().catch(() => ({}))
    const { action, amount = 0, downloadData } = body

    // If userId not resolved from token, fallback to body.userId if provided
    if (!userId && body.userId) {
      userId = body.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch current user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('tokens')
      .eq('id', userId)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const currentTokens = profile.tokens ?? 0

    if (action === 'deduct') {
      const cost = Math.max(0, parseInt(amount, 10) || 0)
      const newBalance = Math.max(0, currentTokens - cost)

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ tokens: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      // Log download into downloads history
      if (downloadData) {
        await supabaseAdmin.from('downloads').insert({
          user_id: userId,
          url: downloadData.url || '',
          title: downloadData.title || 'Media File',
          thumbnail_url: downloadData.thumbnailUrl || null,
          media_type: downloadData.mediaType || 'video',
          format: downloadData.format || 'mp4',
          token_cost: cost,
        })
      }

      return NextResponse.json({ success: true, tokens: newBalance })
    }

    if (action === 'add') {
      const credit = Math.max(0, parseInt(amount, 10) || 0)
      const newBalance = currentTokens + credit

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({ tokens: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, tokens: newBalance })
    }

    if (action === 'record_free') {
      if (downloadData) {
        await supabaseAdmin.from('downloads').insert({
          user_id: userId,
          url: downloadData.url || '',
          title: downloadData.title || 'Free Media Stream',
          thumbnail_url: downloadData.thumbnailUrl || null,
          media_type: downloadData.mediaType || 'audio',
          format: downloadData.format || 'mp3',
          token_cost: 0,
        })
      }
      return NextResponse.json({ success: true, tokens: currentTokens })
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 })

  } catch (err: any) {
    console.error('[Token API Error]:', err)
    return NextResponse.json({ error: err?.message || 'Token processing failed' }, { status: 500 })
  }
}
