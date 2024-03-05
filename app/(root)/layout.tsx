import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import Topbar from '@/components/shared/Topbar'
import LeftSidebar from '@/components/shared/LeftSidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegaSee',
  description: 'An adventure sharing application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
        <body className={`${inter.className} bg-dark-2`}>
          <Topbar />
            <main className="flex flex-row">
              <LeftSidebar />
                <section className="main-container">
                  <div className="justify-between">
                    {children}
                  </div>
                </section>
            </main>
        </body>
      </html>
  )
}
