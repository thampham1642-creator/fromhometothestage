import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/users/me — profile + recent sessions + week map + total count
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, name, avatar_url, current_streak, longest_streak, last_practiced_at, created_at')
    .eq('email', session.user.email)
    .single()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: sessions } = await supabase
    .from('practice_sessions')
    .select('id, difficulty, practiced_at, question:questions(text, difficulty)')
    .eq('user_id', profile.id)
    .order('practiced_at', { ascending: false })
    .limit(20)

  // Total sessions count (not limited to 20)
  const { count: totalSessions } = await supabase
    .from('practice_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  // Build 7-day map using client timezone if provided, else UTC
  const tzOffset = parseInt(req.nextUrl.searchParams.get('tz_offset') ?? '0', 10)
  const weekMap: Record<string, boolean> = {}
  const now = new Date(Date.now() - tzOffset * 60_000)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    weekMap[d.toISOString().split('T')[0]] = false
  }
  ;(sessions ?? []).forEach((s) => {
    const adjusted = new Date(new Date(s.practiced_at).getTime() - tzOffset * 60_000)
    const day = adjusted.toISOString().split('T')[0]
    if (day in weekMap) weekMap[day] = true
  })

  return NextResponse.json({ profile, sessions: sessions ?? [], totalSessions: totalSessions ?? 0, weekMap })
}
