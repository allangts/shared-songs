'use client'

import { useState, useEffect } from 'react'
import SongCard from '@/components/SongCard'
import {
  FaMusic,
  FaHeadphones,
  FaCloudUploadAlt,
  FaSpinner,
  FaLock,
  FaCompactDisc,
} from 'react-icons/fa'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import type { Song } from '@/types'

function LandingPage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 via-emerald-950/20 to-zinc-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative px-4 md:px-8 pt-12 md:pt-24 pb-16 md:pb-28">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <FaHeadphones className="text-emerald-500" />
              <span className="text-emerald-500 text-sm font-semibold uppercase tracking-wider">
                Sua Biblioteca Musical Pessoal
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Suas{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                músicas
              </span>
              <br />
              sempre com você
            </h1>

            <p className="text-zinc-400 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Faça upload das suas músicas e ouça de qualquer lugar.
              Sua biblioteca pessoal, segura e privada.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <Link
                href="/register"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 px-10 rounded-full text-sm md:text-base transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25"
              >
                Criar Conta Grátis
              </Link>
              <Link
                href="/login"
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 px-10 rounded-full text-sm md:text-base transition-all hover:scale-105 border border-zinc-700"
              >
                Entrar
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
                <div className="w-12 h-12 mx-auto mb-4 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <FaCloudUploadAlt className="text-emerald-500 text-xl" />
                </div>
                <h3 className="font-semibold mb-2">Upload Fácil</h3>
                <p className="text-zinc-400 text-sm">
                  Arraste e solte seus arquivos MP3, WAV, FLAC e ouça instantaneamente.
                </p>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
                <div className="w-12 h-12 mx-auto mb-4 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <FaLock className="text-emerald-500 text-xl" />
                </div>
                <h3 className="font-semibold mb-2">100% Privado</h3>
                <p className="text-zinc-400 text-sm">
                  Apenas você tem acesso às suas músicas. Ninguém mais pode ver ou ouvir.
                </p>
              </div>
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/50">
                <div className="w-12 h-12 mx-auto mb-4 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <FaCompactDisc className="text-emerald-500 text-xl" />
                </div>
                <h3 className="font-semibold mb-2">Player Completo</h3>
                <p className="text-zinc-400 text-sm">
                  Organize por gênero, busque, favorite e ouça com um player moderno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const [recentSongs, setRecentSongs] = useState<Song[]>([])
  const [mostPlayed, setMostPlayed] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSongs, setTotalSongs] = useState(0)

  useEffect(() => {
    async function fetchSongs() {
      try {
        const [recentRes, popularRes] = await Promise.all([
          fetch('/api/songs?sort=recent&limit=8'),
          fetch('/api/songs?sort=popular&limit=8'),
        ])

        if (recentRes.ok) {
          const data = await recentRes.json()
          setRecentSongs(data.songs)
          setTotalSongs(data.songs.length)
        }
        if (popularRes.ok) {
          const data = await popularRes.json()
          setMostPlayed(data.songs)
        }
      } catch (err) {
        console.error('Erro ao buscar músicas:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSongs()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-b from-emerald-900/20 to-zinc-950 px-4 md:px-8 pt-6 md:pt-10 pb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Bom dia! 🎵
          </h1>
          <p className="text-zinc-400 text-sm">
            Sua biblioteca pessoal · {totalSongs} música{totalSongs !== 1 && 's'}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 py-4 md:py-6 max-w-7xl mx-auto space-y-10 md:space-y-14">
        {/* Adicionadas Recentemente */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                Adicionadas Recentemente
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Seus últimos uploads
              </p>
            </div>
            <Link
              href="/library"
              className="text-sm text-zinc-400 hover:text-white transition-colors font-medium hidden md:block"
            >
              Ver tudo →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-800/30 rounded-xl p-4 animate-pulse"
                >
                  <div className="aspect-square rounded-lg bg-zinc-800 mb-3" />
                  <div className="h-4 bg-zinc-800 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recentSongs.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {recentSongs.map((song) => (
                <SongCard key={song.id} song={song} songs={recentSongs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
              <FaMusic className="mx-auto mb-4 text-4xl text-zinc-700" />
              <h3 className="text-lg font-semibold mb-2">
                Sua biblioteca está vazia
              </h3>
              <p className="text-zinc-500 text-sm mb-4">
                Faça upload da sua primeira música!
              </p>
              <Link
                href="/upload"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-all hover:scale-105"
              >
                Fazer Upload
              </Link>
            </div>
          )}
        </section>

        {/* Mais Ouvidas */}
        {mostPlayed.length > 0 &&
          mostPlayed.some((s) => s.plays > 0) && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">
                    🔥 Mais Ouvidas
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    As músicas que você mais escuta
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {mostPlayed
                  .filter((s) => s.plays > 0)
                  .map((song) => (
                    <SongCard key={song.id} song={song} songs={mostPlayed} />
                  ))}
              </div>
            </section>
          )}

        {/* CTA Upload */}
        {recentSongs.length > 0 && (
          <section className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 rounded-2xl p-6 md:p-10 border border-emerald-800/20">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Adicione mais músicas
              </h2>
              <p className="text-zinc-400 mb-6">
                Faça upload de mais músicas para a sua biblioteca pessoal.
                É rápido e fácil.
              </p>
              <Link
                href="/upload"
                className="inline-block bg-white hover:bg-zinc-100 text-black font-bold py-3 px-8 rounded-full text-sm transition-all hover:scale-105"
              >
                Fazer Upload →
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
      </div>
    )
  }

  return user ? <Dashboard /> : <LandingPage />
}
