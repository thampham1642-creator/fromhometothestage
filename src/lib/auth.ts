import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { createAdminClient } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId:     process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      try {
        const supabase = createAdminClient()
        await supabase.from('profiles').upsert(
          { email: user.email, name: user.name ?? null, avatar_url: user.image ?? null },
          { onConflict: 'email', ignoreDuplicates: true }
        )
      } catch (err) {
        console.error('Profile upsert error:', err)
      }
      return true
    },

    async session({ session }) {
      if (session.user?.email) {
        try {
          const supabase = createAdminClient()
          const { data } = await supabase
            .from('profiles')
            .select('id, current_streak, longest_streak')
            .eq('email', session.user.email)
            .single()
          if (data) session.profile = data
        } catch (err) {
          console.error('Session callback error:', err)
        }
      }
      return session
    },
  },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
}
