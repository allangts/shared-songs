'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SongCard from '@/components/SongCard'
import {
  FaMusic,
  FaSpinner,
  FaCloudUploadAlt,
  FaSignOutAlt,
  FaCompactDisc,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import type { Song } from '@/types'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPlays, setTotalPlays] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchSongs()
    }
  }, [user, authLoading])

  async function fetchSongs() {
    setLoading(true)
    try {
      const res = await fetch('/api/songs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setSongs(data.songs)
        setTotalPlays(
          data.songs.reduce((acc: number, s: Song) => acc + s.plays, 0)
        )
      }
    } catch (err) {
      console.error('Erro ao buscar músicas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Logout realizado!')
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/20 rounded-2xl p-6 md:p-10 mb-8 border border-emerald-800/20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-4xl md:text-5xl font-bold text-black shadow-2xl shadow-emerald-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">
              Meu Perfil
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {user.name}
            </h1>
            <p className="text-zinc-400">{user.email}</p>
            <div className="flex items-center justify-center md:justify-start gap-6 mt-3 text-sm">
              <span className="text-zinc-400">
                <strong className="text-white">{songs.length}</strong> música
                {songs.length !== 1 && 's'}
              </span>
              <span className="text-zinc-400">
                <strong className="text-white">{totalPlays}</strong> reproduç
                {totalPlays !== 1 ? 'ões' : 'ão'}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/upload"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-5 rounded-full text-sm transition-all hover:scale-105"
            >
              <FaCloudUploadAlt />
              Upload
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-full text-sm transition-all border border-zinc-700"
            >
              <FaSignOutAlt />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Músicas */}
      <div className="mb-5">
        <h2 className="text-xl font-bold">Minhas Músicas</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Todas as músicas que você enviou
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} songs={songs} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FaCloudUploadAlt className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">Nenhum upload ainda</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Comece a construir sua biblioteca pessoal de músicas!
          </p>
          <Link
            href="/upload"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-all hover:scale-105"
          >
            Fazer Upload
          </Link>
        </div>
      )}
    </div>
  )
}
