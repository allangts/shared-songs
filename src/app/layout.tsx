import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PlayerProvider } from '@/contexts/PlayerContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Player from '@/components/Player'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shared Songs - Compartilhe Músicas com o Mundo',
  description:
    'Plataforma colaborativa onde você faz upload de músicas e compartilha com toda a comunidade. Descubra novas músicas todos os dias.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <AuthProvider>
          <PlayerProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#27272a',
                  color: '#fff',
                  border: '1px solid #3f3f46',
                },
                success: {
                  iconTheme: {
                    primary: '#1DB954',
                    secondary: '#000',
                  },
                },
              }}
            />
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 pb-36 md:pb-24 md:ml-64">
                {children}
              </main>
            </div>
            <Player />
            <MobileNav />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
