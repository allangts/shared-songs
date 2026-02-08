'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import SongCard from '@/components/SongCard'
import {
  FaArrowLeft,
  FaSpinner,
  FaTrash,
  FaPlus,
  FaFolderOpen,
  FaPlay,
  FaPen,
  FaTimes,
  FaMusic,
  FaCheck,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { usePlayer } from '@/contexts/PlayerContext'
import type { Album, Song } from '@/types'
import toast from 'react-hot-toast'

export default function AlbumDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const { playSong } = usePlayer()
  const router = useRouter()
  const params = useParams()
  const albumId = params.id as string

  const [album, setAlbum] = useState<Album | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Add song modal
  const [showAddSong, setShowAddSong] = useState(false)
  const [allSongs, setAllSongs] = useState<Song[]>([])
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set())
  const [addingSongs, setAddingSongs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchAlbum()
    }
  }, [user, authLoading, albumId])

  async function fetchAlbum() {
    setLoading(true)
    try {
      const res = await fetch(`/api/albums/${albumId}`)
      if (res.ok) {
        const data = await res.json()
        setAlbum(data.album)
        setEditName(data.album.name)
        setEditDescription(data.album.description || '')
      } else {
        toast.error('Álbum não encontrado')
        router.push('/albums')
      }
    } catch (err) {
      console.error('Erro ao buscar álbum:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllSongs() {
    setLoadingSongs(true)
    try {
      const res = await fetch('/api/songs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setAllSongs(data.songs)
      }
    } catch (err) {
      console.error('Erro ao buscar músicas:', err)
    } finally {
      setLoadingSongs(false)
    }
  }

  function handleOpenAddSong() {
    setShowAddSong(true)
    setSelectedSongIds(new Set())
    setSearchQuery('')
    fetchAllSongs()
  }

  function handleCloseAddSong() {
    setShowAddSong(false)
    setSelectedSongIds(new Set())
    setSearchQuery('')
  }

  function toggleSongSelection(songId: string) {
    setSelectedSongIds((prev) => {
      const next = new Set(prev)
      if (next.has(songId)) {
        next.delete(songId)
      } else {
        next.add(songId)
      }
      return next
    })
  }

  function toggleSelectAll(filteredSongs: Song[]) {
    const allFilteredIds = filteredSongs.map((s) => s.id)
    const allSelected = allFilteredIds.every((id) => selectedSongIds.has(id))

    if (allSelected) {
      // Deselect all filtered
      setSelectedSongIds((prev) => {
        const next = new Set(prev)
        allFilteredIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      // Select all filtered
      setSelectedSongIds((prev) => {
        const next = new Set(prev)
        allFilteredIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  async function handleAddSelectedSongs() {
    if (selectedSongIds.size === 0) return

    setAddingSongs(true)
    try {
      const res = await fetch(`/api/albums/${albumId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: Array.from(selectedSongIds) }),
      })

      if (res.ok) {
        const data = await res.json()
        const msg =
          data.added === 1
            ? '1 música adicionada ao álbum!'
            : `${data.added} músicas adicionadas ao álbum!`
        toast.success(msg)
        handleCloseAddSong()
        fetchAlbum()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao adicionar músicas')
      }
    } catch {
      toast.error('Erro ao adicionar músicas')
    } finally {
      setAddingSongs(false)
    }
  }

  async function handleRemoveSong(songId: string) {
    if (!confirm('Remover esta música do álbum?')) return

    try {
      const res = await fetch(`/api/albums/${albumId}/songs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songId }),
      })

      if (res.ok) {
        toast.success('Música removida do álbum')
        setAlbum((prev) =>
          prev
            ? {
                ...prev,
                songs: prev.songs?.filter((s) => s.id !== songId),
                songCount: prev.songCount - 1,
              }
            : null
        )
      } else {
        toast.error('Erro ao remover música')
      }
    } catch {
      toast.error('Erro ao remover música')
    }
  }

  async function handleUpdateAlbum() {
    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      })

      if (res.ok) {
        setAlbum((prev) =>
          prev
            ? { ...prev, name: editName, description: editDescription || null }
            : null
        )
        setEditing(false)
        toast.success('Álbum atualizado!')
      } else {
        toast.error('Erro ao atualizar álbum')
      }
    } catch {
      toast.error('Erro ao atualizar álbum')
    }
  }

  async function handleDeleteAlbum() {
    if (!confirm('Tem certeza que deseja excluir este álbum? As músicas não serão excluídas.')) return

    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Álbum excluído')
        router.push('/albums')
      } else {
        toast.error('Erro ao excluir álbum')
      }
    } catch {
      toast.error('Erro ao excluir álbum')
    }
  }

  function handlePlayAll() {
    if (album?.songs && album.songs.length > 0) {
      playSong(album.songs[0], album.songs)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
      </div>
    )
  }

  if (!user || !album) return null

  const albumSongIds = new Set(album.songs?.map((s) => s.id) || [])
  const availableSongs = allSongs.filter((s) => !albumSongIds.has(s.id))
  const filteredAvailableSongs = availableSongs.filter((s) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    )
  })

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Back */}
      <Link
        href="/albums"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <FaArrowLeft size={12} />
        Voltar para Álbuns
      </Link>

      {/* Album Header */}
      <div className="bg-gradient-to-r from-violet-900/30 to-fuchsia-900/20 rounded-2xl p-6 md:p-10 mb-8 border border-violet-800/20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden shadow-2xl shadow-violet-500/20 flex-shrink-0">
            {album.coverUrl ? (
              <img
                src={album.coverUrl}
                alt={album.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 flex items-center justify-center">
                <FaFolderOpen className="text-white/30 text-5xl" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">
              Álbum
            </p>
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-xl font-bold text-white w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateAlbum}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-1.5 px-4 rounded-lg text-sm"
                  >
                    <FaCheck size={10} /> Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditName(album.name)
                      setEditDescription(album.description || '')
                    }}
                    className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-1.5 px-4 rounded-lg text-sm"
                  >
                    <FaTimes size={10} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {album.name}
                </h1>
                {album.description && (
                  <p className="text-zinc-400 mb-2">{album.description}</p>
                )}
                <p className="text-sm text-zinc-500">
                  {album.songCount} música{album.songCount !== 1 && 's'}
                </p>
              </>
            )}
          </div>
          {!editing && (
            <div className="flex gap-2 flex-shrink-0">
              {album.songs && album.songs.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-5 rounded-full text-sm transition-all hover:scale-105"
                >
                  <FaPlay size={12} />
                  Tocar
                </button>
              )}
              <button
                onClick={handleOpenAddSong}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-5 rounded-full text-sm transition-all border border-zinc-700"
              >
                <FaPlus size={12} />
                Adicionar
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all border border-zinc-700"
                title="Editar álbum"
              >
                <FaPen size={12} />
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="p-2.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-full transition-all border border-zinc-700 hover:border-red-500/30"
                title="Excluir álbum"
              >
                <FaTrash size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Song Modal - Bulk Selection */}
      {showAddSong && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold">Adicionar Músicas</h3>
                {selectedSongIds.size > 0 && (
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {selectedSongIds.size} música{selectedSongIds.size !== 1 && 's'} selecionada{selectedSongIds.size !== 1 && 's'}
                  </p>
                )}
              </div>
              <button
                onClick={handleCloseAddSong}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Search */}
            {!loadingSongs && availableSongs.length > 0 && (
              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título ou artista..."
                  className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            )}

            {/* Select All / Deselect All */}
            {!loadingSongs && filteredAvailableSongs.length > 0 && (
              <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => toggleSelectAll(filteredAvailableSongs)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  {filteredAvailableSongs.every((s) => selectedSongIds.has(s.id))
                    ? 'Desmarcar tudo'
                    : `Selecionar tudo (${filteredAvailableSongs.length})`}
                </button>
                {searchQuery && (
                  <span className="text-xs text-zinc-500">
                    {filteredAvailableSongs.length} resultado{filteredAvailableSongs.length !== 1 && 's'}
                  </span>
                )}
              </div>
            )}

            {/* Song List */}
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {loadingSongs ? (
                <div className="flex items-center justify-center py-10">
                  <FaSpinner className="animate-spin text-emerald-500 text-xl" />
                </div>
              ) : filteredAvailableSongs.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredAvailableSongs.map((song) => {
                    const isSelected = selectedSongIds.has(song.id)
                    return (
                      <button
                        key={song.id}
                        type="button"
                        onClick={() => toggleSongSelection(song.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl w-full text-left transition-all duration-150 ${
                          isSelected
                            ? 'bg-emerald-500/10 border border-emerald-500/30 ring-1 ring-emerald-500/20'
                            : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <FaCheck className="text-black text-[9px]" />}
                        </div>

                        {/* Cover */}
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-cyan-500 flex items-center justify-center">
                              <FaMusic className="text-white/30 text-xs" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{song.title}</p>
                          <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <FaMusic className="mx-auto mb-3 text-3xl text-zinc-700" />
                  <p className="text-zinc-400 text-sm">
                    {allSongs.length === 0
                      ? 'Nenhuma música na biblioteca'
                      : searchQuery
                        ? 'Nenhuma música encontrada para esta busca'
                        : 'Todas as músicas já estão neste álbum'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with action button */}
            {!loadingSongs && availableSongs.length > 0 && (
              <div className="border-t border-zinc-800 p-4 flex-shrink-0">
                <button
                  onClick={handleAddSelectedSongs}
                  disabled={selectedSongIds.size === 0 || addingSongs}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-400 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                >
                  {addingSongs ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Adicionando...
                    </>
                  ) : selectedSongIds.size === 0 ? (
                    'Selecione músicas para adicionar'
                  ) : (
                    <>
                      <FaPlus size={12} />
                      Adicionar {selectedSongIds.size} música{selectedSongIds.size !== 1 && 's'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Songs */}
      {album.songs && album.songs.length > 0 ? (
        <div className="space-y-2">
          {album.songs.map((song, index) => (
            <div
              key={song.id}
              className="flex items-center gap-3 group"
            >
              <span className="w-6 text-right text-xs text-zinc-500 font-mono">
                {index + 1}
              </span>
              <div className="flex-1">
                <SongCard song={song} songs={album.songs!} />
              </div>
              <button
                onClick={() => handleRemoveSong(song.id)}
                className="p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Remover do álbum"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FaMusic className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">Álbum vazio</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Adicione músicas da sua biblioteca a este álbum.
          </p>
          <button
            onClick={handleOpenAddSong}
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-all hover:scale-105"
          >
            Adicionar Músicas
          </button>
        </div>
      )}
    </div>
  )
}
