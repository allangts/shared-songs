'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SongCard from '@/components/SongCard'
import { FaSearch, FaSpinner, FaMusic } from 'react-icons/fa'
import type { Song } from '@/types'
import { GENRES } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const doSearch = useCallback(
    async (searchQuery: string, genre: string) => {
      if (!user) return
      if (!searchQuery.trim() && !genre) {
        setResults([])
        setSearched(false)
        return
      }

      setLoading(true)
      setSearched(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery.trim()) params.set('search', searchQuery.trim())
        if (genre) params.set('genre', genre)
        params.set('limit', '30')

        const res = await fetch(`/api/songs?${params}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.songs)
        }
      } catch (err) {
        console.error('Erro na busca:', err)
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query, selectedGenre)
    }, 400)
    return () => clearTimeout(timer)
  }, [query, selectedGenre, doSearch])

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
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Buscar na Minha Biblioteca
        </h1>

        {/* Search Input */}
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou artista..."
            className="w-full bg-zinc-800 border border-zinc-700/50 rounded-full py-3.5 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-base"
            autoFocus
          />
        </div>
      </div>

      {/* Genre Quick Filters */}
      <div className="mb-8">
        <p className="text-sm font-medium text-zinc-400 mb-3">
          Filtrar por gênero
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === g
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
        </div>
      ) : results.length > 0 ? (
        <div>
          <p className="text-sm text-zinc-400 mb-4">
            {results.length} resultado{results.length !== 1 && 's'} encontrado
            {results.length !== 1 && 's'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {results.map((song) => (
              <SongCard key={song.id} song={song} songs={results} />
            ))}
          </div>
        </div>
      ) : searched ? (
        <div className="text-center py-20">
          <FaSearch className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-zinc-500 text-sm">
            Tente buscar por outro título ou artista na sua biblioteca
          </p>
        </div>
      ) : (
        <div className="text-center py-20">
          <FaMusic className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">
            Busque nas suas músicas
          </h3>
          <p className="text-zinc-500 text-sm">
            Digite o nome de uma música ou artista para encontrar na sua biblioteca
          </p>
        </div>
      )}
    </div>
  )
}
