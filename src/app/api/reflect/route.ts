import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/reflect — list user's reflections (most recent first)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: reflections, error } = await supabase
    .from('reflections')
    .select(`
      id, practiced_on, feeling, did_well, improve, created_at,
      session:practice_sessions(
        difficulty,
        question:questions(text)
      )
    `)
    .eq('user_id', profile.id)
    .order('practiced_on', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reflections: reflections ?? [] })
}

// POST /api/reflect — save a new reflection
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    session_id:   string | null
    practiced_on: string
    feeling:      string
    did_well:     string
    improve:      string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, practiced_on, feeling, did_well, improve } = body
  if (!practiced_on || !feeling || !did_well || !improve) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('reflections')
    .insert({
      user_id:      profile.id,
      session_id:   session_id ?? null,
      practiced_on,
      feeling,
      did_well,
      improve,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reflection_id: data.id })
}
