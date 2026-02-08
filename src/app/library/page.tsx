'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SongCard from '@/components/SongCard'
import {
  FaCompactDisc,
  FaSpinner,
  FaFilter,
  FaCloudUploadAlt,
  FaTrash,
} from 'react-icons/fa'
import { GENRES } from '@/types'
import type { Song } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import toast from 'react-hot-toast'

function LibraryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent')
  const [genre, setGenre] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchSongs()
    }
  }, [user, authLoading, sort, genre, favorites])

  async function fetchSongs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('sort', sort)
      params.set('limit', '40')
      if (genre) params.set('genre', genre)
      if (favorites) params.set('favorites', 'true')

      const res = await fetch(`/api/songs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSongs(data.songs)
      }
    } catch (err) {
      console.error('Erro ao buscar músicas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (songId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta música?')) return

    try {
      const res = await fetch(`/api/songs/${songId}`, { method: 'DELETE' })
      if (res.ok) {
        setSongs((prev) => prev.filter((s) => s.id !== songId))
        toast.success('Música excluída')
      } else {
        toast.error('Erro ao excluir música')
      }
    } catch {
      toast.error('Erro ao excluir música')
    }
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
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FaCompactDisc className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Minha Biblioteca
              </h1>
              <p className="text-sm text-zinc-500">
                {songs.length} música{songs.length !== 1 && 's'} na sua coleção
              </p>
            </div>
          </div>
          <Link
            href="/upload"
            className="hidden md:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-5 rounded-full text-sm transition-all hover:scale-105"
          >
            <FaCloudUploadAlt />
            Upload
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showFilters || genre
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <FaFilter size={12} />
          Filtros
          {genre && (
            <span className="bg-emerald-500 text-black text-xs px-1.5 py-0.5 rounded-full">
              1
            </span>
          )}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setSort('recent')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sort === 'recent'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Recentes
          </button>
          <button
            onClick={() => setSort('popular')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              sort === 'popular'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Mais ouvidas
          </button>
          <button
            onClick={() => setFavorites(!favorites)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              favorites
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            ♥ Favoritas
          </button>
        </div>
      </div>

      {/* Genre Filter */}
      {showFilters && (
        <div className="mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
          <p className="text-sm font-medium text-zinc-400 mb-3">
            Filtrar por gênero:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGenre('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                !genre
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  genre === g
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Songs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} songs={songs} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FaCompactDisc className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">
            {favorites
              ? 'Nenhuma favorita ainda'
              : genre
                ? `Nenhuma música no gênero "${genre}"`
                : 'Sua biblioteca está vazia'}
          </h3>
          <p className="text-zinc-500 text-sm mb-4">
            {favorites
              ? 'Marque músicas como favoritas para vê-las aqui.'
              : 'Faça upload das suas músicas para começar a ouvir.'}
          </p>
          {!favorites && (
            <Link
              href="/upload"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-all hover:scale-105"
            >
              Fazer Upload
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  )
}
