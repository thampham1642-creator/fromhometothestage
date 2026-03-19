import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    profile?: {
      id:             string
      current_streak: number
      longest_streak: number
    }
  }
}
