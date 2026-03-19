import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/challenges
export async function GET() {
  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Participant counts per challenge
  const { data: countRows } = await supabase
    .from('challenge_participants')
    .select('challenge_id')

  const countMap: Record<string, number> = {}
  countRows?.forEach((r) => {
    countMap[r.challenge_id] = (countMap[r.challenge_id] ?? 0) + 1
  })

  // Current user's participations
  let userMap: Record<string, { progress: number; completed: boolean }> = {}
  if (session?.user?.email) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (profileRow) {
      const { data: parts } = await supabase
        .from('challenge_participants')
        .select('challenge_id, progress, completed')
        .eq('user_id', profileRow.id)

      parts?.forEach((p) => {
        userMap[p.challenge_id] = { progress: p.progress, completed: p.completed }
      })
    }
  }

  const enriched = (challenges ?? []).map((c) => ({
    ...c,
    participant_count: countMap[c.id] ?? 0,
    user_progress:     userMap[c.id]?.progress ?? null,
    user_joined:       c.id in userMap,
  }))

  return NextResponse.json({ challenges: enriched })
}

// POST /api/challenges — join a challenge
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { challenge_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { challenge_id } = body
  if (!challenge_id) {
    return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { error } = await supabase.from('challenge_participants').insert({
    challenge_id,
    user_id: profile.id,
  })

  // 23505 = unique_violation — already joined, treat as success
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ joined: true })
}
