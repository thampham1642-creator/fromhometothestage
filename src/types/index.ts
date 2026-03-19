export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  current_streak: number
  longest_streak: number
  last_practiced_at: string | null
  created_at: string
}

export interface Question {
  id: string
  text: string
  difficulty: Difficulty
  category: string | null
  is_custom: boolean
  created_by: string | null
  created_at: string
}

export interface PracticeSession {
  id: string
  user_id: string
  question_id: string
  difficulty: Difficulty
  practiced_at: string
  question?: Pick<Question, 'text' | 'difficulty'>
}

export interface Reflection {
  id: string
  user_id: string
  session_id: string | null
  practiced_on: string
  feeling: string
  did_well: string
  improve: string
  created_at: string
  session?: {
    difficulty: Difficulty
    question?: { text: string }
  }
}

export interface Challenge {
  id: string
  title: string
  description: string
  duration_days: number
  goal_count: number
  difficulty_filter: Difficulty | 'any'
  is_active: boolean
  starts_at: string
  ends_at: string
  created_at: string
  participant_count?: number
  user_progress?: number
  user_joined?: boolean
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  progress: number
  completed: boolean
  joined_at: string
  profile?: Profile
}

export interface LeaderboardEntry {
  user_id: string
  name: string | null
  avatar_url: string | null
  progress: number
  completed: boolean
}
