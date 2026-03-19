# From Home to the Stage

> Practice impromptu speaking every day. Build the habit, own the stage.

## Stack

- **Next.js 14** (App Router)
- **NextAuth.js** (Google + GitHub OAuth)
- **Supabase** (Postgres database + Row Level Security)
- **Tailwind CSS**
- **TypeScript**

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub → Settings → Developer Settings → OAuth Apps |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (keep secret!) |

### 3. Set up the database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the **SQL Editor**
3. Paste and run the contents of `supabase-schema.sql`

This creates all tables, RLS policies, and seeds 30 questions + 3 challenges.

### 4. Add the Glacial Indifference font

Download the font from [here](https://www.fontsquirrel.com/fonts/glacial-indifference) and place the files at:

```
public/fonts/GlacialIndifference-Regular.otf
public/fonts/GlacialIndifference-Bold.otf
```

### 5. Set up Google OAuth

In [Google Cloud Console](https://console.cloud.google.com):
- Create OAuth 2.0 credentials
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- For production: `https://yourdomain.com/api/auth/callback/google`

### 6. Set up GitHub OAuth

In GitHub → Settings → Developer Settings → OAuth Apps:
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── practice/             # GET random question, POST log session
│   │   ├── challenges/           # GET challenges, POST join
│   │   │   └── [id]/leaderboard/ # GET leaderboard for a challenge
│   │   └── users/me/             # GET current user profile + history
│   ├── auth/signin/              # Custom sign-in page
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                  # Home page
│   └── providers.tsx             # SessionProvider wrapper
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Top nav with auth buttons
│   │   ├── StreakBar.tsx         # XP / streak stats bar
│   │   └── TabView.tsx           # Tab navigation
│   ├── practice/
│   │   ├── PracticeTab.tsx       # Main practice view
│   │   ├── QuestionCard.tsx      # Displays the current question
│   │   └── TimerCard.tsx         # Countdown timer with +/- controls
│   ├── challenges/
│   │   ├── ChallengesTab.tsx     # Challenge list
│   │   └── LeaderboardPanel.tsx  # Per-challenge leaderboard
│   └── history/
│       └── HistoryTab.tsx        # Stats, week view, recent sessions
├── hooks/
│   └── useTimer.ts               # Reusable countdown timer hook
├── lib/
│   ├── auth.ts                   # NextAuth config + Supabase profile sync
│   └── supabase.ts               # Supabase client + admin client
└── types/
    └── index.ts                  # Shared TypeScript types + XP helpers
```

---

## How XP Works

| Difficulty | XP earned |
|---|---|
| Easy | 10 XP |
| Medium | 20 XP |
| Hard | 35 XP |

Every 100 XP = 1 level up.

## How Streak Works

- Practice at least once per day to maintain your streak
- Miss a day → streak resets to 1
- Streak is calculated server-side on each session log

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Update OAuth redirect URIs to your production domain
```

---

## Future Ideas

- Custom question submission by users
- Video recording directly in the browser (MediaRecorder API)
- AI feedback on answers (Whisper transcription + Claude evaluation)
- Weekly email digest of streak + progress
- Community feed of completed challenges
