'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaHome,
  FaSearch,
  FaCompactDisc,
  FaCloudUploadAlt,
  FaUser,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Se não está logado, mostra nav mínima
  const items = user
    ? [
        { href: '/', icon: FaHome, label: 'Início' },
        { href: '/library', icon: FaCompactDisc, label: 'Biblioteca' },
        { href: '/upload', icon: FaCloudUploadAlt, label: 'Upload' },
        { href: '/search', icon: FaSearch, label: 'Buscar' },
        { href: '/profile', icon: FaUser, label: 'Perfil' },
      ]
    : [
        { href: '/', icon: FaHome, label: 'Início' },
        { href: '/login', icon: FaUser, label: 'Entrar' },
      ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-zinc-900/98 to-zinc-900/95 backdrop-blur-xl border-t border-zinc-800/30 z-50 safe-area-bottom">
      <div className="flex justify-around items-center py-2 pb-3">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px] transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
