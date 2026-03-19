import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

interface ParticipantRow {
  user_id:   string
  progress:  number
  completed: boolean
  profiles:  { name: string | null; avatar_url: string | null } | null
}

// GET /api/challenges/[id]/leaderboard
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('challenge_participants')
    .select('user_id, progress, completed, profiles(name, avatar_url)')
    .eq('challenge_id', id)
    .order('progress', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leaderboard = (data as unknown as ParticipantRow[] ?? []).map((row) => ({
    user_id:    row.user_id,
    name:       row.profiles?.name ?? 'Anonymous',
    avatar_url: row.profiles?.avatar_url ?? null,
    progress:   row.progress,
    completed:  row.completed,
  }))

  return NextResponse.json({ leaderboard })
}
