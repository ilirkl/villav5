import './globals.css'
import type { Metadata } from 'next'
import Header from './components/Header'
import Navbar from './components/Navbar'


export const metadata: Metadata = {
  title: 'Villa e Gurit',
  description: 'Villa e Gurit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div className="min-h-screen bg-gray-50 pb-20">
          <main className="max-w-7xl mx-auto pl-1 sm:px-6 lg:px-8 py-1">
            {children}
          </main>
        </div>
        <Navbar />
      </body>
    </html>
  )
}
