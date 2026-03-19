import { Navbar }    from '@/components/layout/Navbar'
import { StreakBar } from '@/components/layout/StreakBar'
import { TabView }   from '@/components/layout/TabView'

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Navbar />
        <StreakBar />
        <TabView />
      </div>
    </main>
  )
}
