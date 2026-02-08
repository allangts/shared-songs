'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FaPlus,
  FaSpinner,
  FaTrash,
  FaMusic,
  FaFolderOpen,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import type { Album } from '@/types'
import toast from 'react-hot-toast'

export default function AlbumsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchAlbums()
    }
  }, [user, authLoading])

  async function fetchAlbums() {
    setLoading(true)
    try {
      const res = await fetch('/api/albums')
      if (res.ok) {
        const data = await res.json()
        setAlbums(data.albums)
      }
    } catch (err) {
      console.error('Erro ao buscar álbuns:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      toast.error('Nome do álbum é obrigatório')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setAlbums((prev) => [data.album, ...prev])
        setNewName('')
        setNewDescription('')
        setShowCreate(false)
        toast.success('Álbum criado!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao criar álbum')
      }
    } catch {
      toast.error('Erro ao criar álbum')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(albumId: string) {
    if (!confirm('Tem certeza que deseja excluir este álbum? As músicas não serão excluídas.')) return

    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' })
      if (res.ok) {
        setAlbums((prev) => prev.filter((a) => a.id !== albumId))
        toast.success('Álbum excluído')
      } else {
        toast.error('Erro ao excluir álbum')
      }
    } catch {
      toast.error('Erro ao excluir álbum')
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
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
            <FaFolderOpen className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Meus Álbuns</h1>
            <p className="text-sm text-zinc-500">
              {albums.length} álbun{albums.length !== 1 && 's'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-5 rounded-full text-sm transition-all hover:scale-105"
        >
          <FaPlus size={12} />
          Novo Álbum
        </button>
      </div>

      {/* Create Album Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8"
        >
          <h3 className="text-lg font-semibold mb-4">Criar Novo Álbum</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Nome do Álbum *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Favoritas de 2024"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Uma breve descrição do álbum"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black disabled:text-zinc-400 font-bold py-2.5 px-6 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <FaSpinner className="animate-spin" /> Criando...
                  </>
                ) : (
                  'Criar Álbum'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setNewName('')
                  setNewDescription('')
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Albums Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
          {albums.map((album) => (
            <div key={album.id} className="group relative">
              <Link
                href={`/albums/${album.id}`}
                className="block bg-zinc-800/30 hover:bg-zinc-800/70 rounded-xl p-3 md:p-4 transition-all duration-300"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg shadow-black/30">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400 flex items-center justify-center">
                      <FaFolderOpen className="text-white/20 text-3xl md:text-4xl" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm md:text-base truncate leading-tight">
                  {album.name}
                </h3>
                <p className="text-xs md:text-sm text-zinc-400 truncate mt-1">
                  {album.songCount} música{album.songCount !== 1 && 's'}
                  {album.description && ` · ${album.description}`}
                </p>
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(album.id)
                }}
                className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Excluir álbum"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FaFolderOpen className="mx-auto mb-4 text-4xl text-zinc-700" />
          <h3 className="text-lg font-semibold mb-2">Nenhum álbum ainda</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Crie seu primeiro álbum para organizar suas músicas.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-6 rounded-full text-sm transition-all hover:scale-105"
          >
            Criar Álbum
          </button>
        </div>
      )}
    </div>
  )
}
