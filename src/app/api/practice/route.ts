import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { type Difficulty } from '@/types'

// GET /api/practice?difficulty=easy
export async function GET(req: NextRequest) {
  const difficulty = (req.nextUrl.searchParams.get('difficulty') ?? 'easy') as Difficulty
  const validDiffs: Difficulty[] = ['easy', 'medium', 'hard']
  if (!validDiffs.includes(difficulty)) {
    return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
  }

  const poolMode = req.nextUrl.searchParams.get('pool') === 'true'
  const limitStr = req.nextUrl.searchParams.get('limit')
  const limit = limitStr ? parseInt(limitStr, 10) : 15

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('questions')
    .select('id, text, difficulty, category')
    .eq('difficulty', difficulty)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'No questions found' }, { status: 404 })
  }

  if (poolMode) {
    const shuffled = [...data].sort(() => 0.5 - Math.random())
    const selectedPool = shuffled.slice(0, Math.min(limit, data.length))
    return NextResponse.json({ questions: selectedPool })
  }

  const question = data[Math.floor(Math.random() * data.length)]
  return NextResponse.json({ question })
}

// POST /api/practice — log a completed session, returns session_id for Reflect
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { question_id: string; difficulty: Difficulty; tz_offset?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { question_id, difficulty, tz_offset } = body
  if (!question_id || !difficulty) {
    return NextResponse.json({ error: 'Missing question_id or difficulty' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, current_streak, longest_streak, last_practiced_at')
    .eq('email', session.user.email)
    .single()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Log the session — capture the returned id for Reflect flow
  const { data: inserted, error: insertErr } = await supabase
    .from('practice_sessions')
    .insert({ user_id: profile.id, question_id, difficulty })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return NextResponse.json({ error: insertErr?.message ?? 'Insert failed' }, { status: 500 })
  }

  // --- Streak logic (timezone-aware) ---
  // tz_offset is in minutes (e.g. -420 for UTC+7), same as JS getTimezoneOffset()
  const offsetMs = (typeof tz_offset === 'number' ? tz_offset : 0) * 60_000
  const nowLocal = new Date(Date.now() - offsetMs)
  const today     = nowLocal.toISOString().split('T')[0]
  const yesterday = new Date(nowLocal.getTime() - 86_400_000).toISOString().split('T')[0]
  const lastDate  = profile.last_practiced_at

  let newStreak = profile.current_streak
  if (lastDate === today) {
    // already practiced today
  } else if (lastDate === yesterday) {
    newStreak = profile.current_streak + 1
  } else {
    newStreak = 1
  }

  await supabase
    .from('profiles')
    .update({
      current_streak:    newStreak,
      longest_streak:    Math.max(profile.longest_streak, newStreak),
      last_practiced_at: today,
    })
    .eq('id', profile.id)

  // --- Update challenge progress ---
  const { data: participations } = await supabase
    .from('challenge_participants')
    .select('id, progress, challenges(is_active, difficulty_filter, goal_count)')
    .eq('user_id', profile.id)
    .eq('completed', false)

  if (participations && participations.length > 0) {
    for (const p of participations) {
      const challenge = (p as unknown as {
        challenges: { is_active: boolean; difficulty_filter: string; goal_count: number } | null
      }).challenges
      if (!challenge?.is_active) continue
      if (challenge.difficulty_filter !== 'any' && challenge.difficulty_filter !== difficulty) continue
      const newProgress = p.progress + 1
      await supabase
        .from('challenge_participants')
        .update({ progress: newProgress, completed: newProgress >= challenge.goal_count })
        .eq('id', p.id)
    }
  }

  return NextResponse.json({ session_id: inserted.id, new_streak: newStreak })
}
