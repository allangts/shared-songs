'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaHome,
  FaSearch,
  FaCompactDisc,
  FaCloudUploadAlt,
  FaMusic,
  FaSignOutAlt,
  FaUser,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = user
    ? [
        { href: '/', icon: FaHome, label: 'Início' },
        { href: '/library', icon: FaCompactDisc, label: 'Minha Biblioteca' },
        { href: '/search', icon: FaSearch, label: 'Buscar' },
      ]
    : [{ href: '/', icon: FaHome, label: 'Início' }]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-black/80 backdrop-blur-xl fixed left-0 top-0 bottom-0 z-40 border-r border-zinc-800/50">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-400 transition-colors">
            <FaMusic className="text-black text-sm" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">
              Shared Songs
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1">
        <div className="mb-2 px-3 pt-2">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Menu
          </span>
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-900/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}

        {user && (
          <>
            <div className="my-3 mx-3 border-t border-zinc-800/50" />
            <Link
              href="/upload"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 ${
                pathname === '/upload'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/5'
              }`}
            >
              <FaCloudUploadAlt size={18} />
              <span className="font-medium text-sm">Upload</span>
            </Link>
            <Link
              href="/profile"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 ${
                pathname === '/profile'
                  ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-900/50'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <FaUser size={18} />
              <span className="font-medium text-sm">Meu Perfil</span>
            </Link>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-zinc-800/50">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              title="Sair"
            >
              <FaSignOutAlt size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/register"
              className="block text-center py-2 px-4 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-transform"
            >
              Registrar
            </Link>
            <Link
              href="/login"
              className="block text-center py-2 px-4 text-zinc-400 hover:text-white font-semibold text-sm transition-colors"
            >
              Entrar
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
