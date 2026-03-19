import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'From Home to the Stage',
  description: 'Practice impromptu speaking every day. Build the habit, own the stage.',
  openGraph: {
    title:       'From Home to the Stage',
    description: 'Practice impromptu speaking every day. Build the habit, own the stage.',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
