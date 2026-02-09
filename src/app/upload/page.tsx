'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FaCloudUploadAlt,
  FaMusic,
  FaImage,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaPlus,
  FaTrash,
  FaFolderOpen,
  FaTag,
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { GENRES } from '@/types'
import type { Album } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'
import jsmediatags from 'jsmediatags'

interface FileEntry {
  id: string
  file: File
  title: string
  artist: string
  duration: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMsg?: string
}

let entryIdCounter = 0

function generateEntryId() {
  return `entry-${Date.now()}-${entryIdCounter++}`
}

function titleFromFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
}

function getDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      const dur = Math.round(audio.duration)
      URL.revokeObjectURL(audio.src)
      resolve(dur)
    })
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src)
      resolve(0)
    })
  })
}

interface MediaTags {
  title?: string
  artist?: string
  album?: string
  genre?: string
  picture?: { format: string; data: number[] }
}

function readMediaTags(file: File): Promise<MediaTags> {
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (result: any) => {
        const tags = result.tags || {}
        resolve({
          title: tags.title || undefined,
          artist: tags.artist || undefined,
          album: tags.album || undefined,
          genre: tags.genre || undefined,
          picture: tags.picture || undefined,
        })
      },
      onError: () => {
        resolve({})
      },
    })
  })
}

function pictureToBlob(picture: { format: string; data: number[] }): Blob {
  const bytes = new Uint8Array(picture.data)
  return new Blob([bytes], { type: picture.format })
}

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // File entries
  const [entries, setEntries] = useState<FileEntry[]>([])

  // Shared fields for all files
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  // Album selection
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumMode, setAlbumMode] = useState<'none' | 'existing' | 'new'>('none')
  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')

  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Stats
  const totalFiles = entries.length
  const doneCount = entries.filter((e) => e.status === 'done').length
  const errorCount = entries.filter((e) => e.status === 'error').length
  const pendingCount = entries.filter((e) => e.status === 'pending').length

  // Fetch user albums
  useEffect(() => {
    if (!user) return
    fetch('/api/albums')
      .then((res) => (res.ok ? res.json() : { albums: [] }))
      .then((data) => setAlbums(data.albums || []))
      .catch(() => {})
  }, [user])

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'))

      if (audioFiles.length === 0) {
        toast.error('Nenhum arquivo de áudio válido selecionado')
        return
      }

      const oversized = audioFiles.filter((f) => f.size > 100 * 1024 * 1024)
      if (oversized.length > 0) {
        toast.error(`${oversized.length} arquivo(s) excede(m) 100MB e será(ão) ignorado(s)`)
      }

      const validFiles = audioFiles.filter((f) => f.size <= 100 * 1024 * 1024)

      setMetadataLoading(true)

      let firstArtist = ''
      let firstGenre = ''
      let firstPicture: { format: string; data: number[] } | undefined

      const newEntries: FileEntry[] = await Promise.all(
        validFiles.map(async (file, index) => {
          const [duration, tags] = await Promise.all([
            getDuration(file),
            readMediaTags(file),
          ])

          // Capturar dados do primeiro arquivo para preencher campos globais
          if (index === 0) {
            firstArtist = tags.artist || ''
            firstGenre = tags.genre || ''
            firstPicture = tags.picture
          }

          return {
            id: generateEntryId(),
            file,
            title: tags.title || titleFromFilename(file.name),
            artist: tags.artist || '',
            duration,
            status: 'pending' as const,
          }
        })
      )

      // Auto-preencher campos globais se estiverem vazios
      setArtist((prev) => prev || firstArtist)

      // Tentar mapear gênero dos metadados para um dos gêneros disponíveis
      if (firstGenre) {
        const genreLower = firstGenre.toLowerCase()
        const match = GENRES.find(
          (g) => g.toLowerCase() === genreLower || genreLower.includes(g.toLowerCase())
        )
        if (match) {
          setGenre((prev) => prev || match)
        }
      }

      // Auto-preencher capa a partir dos metadados do primeiro arquivo
      if (firstPicture && !coverFile) {
        const blob = pictureToBlob(firstPicture)
        const ext = firstPicture.format.split('/')[1] || 'jpg'
        const metaCoverFile = new File([blob], `cover.${ext}`, {
          type: firstPicture.format,
        })
        setCoverFile(metaCoverFile)
        setCoverPreview(URL.createObjectURL(blob))
      }

      setEntries((prev) => [...prev, ...newEntries])
      setMetadataLoading(false)

      if (validFiles.length === 1) {
        toast.success('1 arquivo adicionado')
      } else {
        toast.success(`${validFiles.length} arquivos adicionados`)
      }
    },
    [coverFile]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEntryTitle = (id: string, title: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, title } : e))
    )
  }

  const updateEntryStatus = (id: string, status: FileEntry['status'], errorMsg?: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status, errorMsg } : e))
    )
  }

  const handleCoverSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida')
        return
      }
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    },
    [coverPreview]
  )

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  const handleUploadAll = async () => {
    const pendingEntries = entries.filter((e) => e.status === 'pending')
    if (pendingEntries.length === 0) {
      toast.error('Nenhum arquivo pendente para enviar')
      return
    }

    if (!artist.trim()) {
      toast.error('Preencha o nome do artista')
      return
    }

    for (const entry of pendingEntries) {
      if (!entry.title.trim()) {
        toast.error(`Preencha o título para "${entry.file.name}"`)
        return
      }
    }

    if (albumMode === 'new' && !newAlbumName.trim()) {
      toast.error('Preencha o nome do novo álbum')
      return
    }

    if (albumMode === 'existing' && !selectedAlbumId) {
      toast.error('Selecione um álbum')
      return
    }

    setUploading(true)

    // Criar novo álbum se necessário
    let albumId = albumMode === 'existing' ? selectedAlbumId : ''

    if (albumMode === 'new') {
      try {
        const res = await fetch('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newAlbumName.trim() }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao criar álbum')
        }
        const data = await res.json()
        albumId = data.album.id
        toast.success(`Álbum "${newAlbumName.trim()}" criado!`)
      } catch (err: any) {
        toast.error(err.message || 'Erro ao criar álbum')
        setUploading(false)
        return
      }
    }

    let successCount = 0
    let failCount = 0
    const uploadedSongIds: string[] = []

    for (const entry of pendingEntries) {
      updateEntryStatus(entry.id, 'uploading')

      try {
        const formData = new FormData()
        formData.append('audio', entry.file)
        formData.append('title', entry.title.trim())
        formData.append('artist', artist.trim())
        formData.append('genre', genre)
        formData.append('duration', String(entry.duration))
        if (coverFile) {
          formData.append('cover', coverFile)
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao enviar')
        }

        const data = await res.json()
        uploadedSongIds.push(data.song.id)
        updateEntryStatus(entry.id, 'done')
        successCount++
      } catch (err: any) {
        updateEntryStatus(entry.id, 'error', err.message || 'Erro ao enviar')
        failCount++
      }
    }

    // Adicionar músicas ao álbum
    if (albumId && uploadedSongIds.length > 0) {
      try {
        await fetch(`/api/albums/${albumId}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songIds: uploadedSongIds }),
        })
      } catch (err) {
        console.error('Erro ao adicionar músicas ao álbum:', err)
        toast.error('Músicas enviadas, mas houve erro ao adicioná-las ao álbum')
      }
    }

    setUploading(false)

    if (failCount === 0) {
      toast.success(
        successCount === 1
          ? 'Música enviada com sucesso! 🎵'
          : `${successCount} músicas enviadas com sucesso! 🎵`
      )
      setTimeout(() => {
        if (albumId) {
          router.push(`/albums/${albumId}`)
        } else {
          router.push('/library')
        }
      }, 1000)
    } else {
      toast.error(
        `${successCount} enviada(s), ${failCount} com erro. Corrija e tente novamente.`
      )
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <FaCloudUploadAlt className="text-5xl text-zinc-700 mb-4" />
        <h2 className="text-xl font-bold mb-2">Login Necessário</h2>
        <p className="text-zinc-400 mb-6 max-w-md">
          Você precisa estar logado para fazer upload de músicas.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-6 rounded-full text-sm transition-all hover:scale-105"
          >
            Entrar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Upload de Músicas</h1>
        <p className="text-zinc-400 mt-2">
          Adicione músicas à sua biblioteca — metadados são lidos automaticamente dos arquivos
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer mb-6 ${
          dragActive
            ? 'border-emerald-500 bg-emerald-500/5'
            : entries.length > 0
              ? 'border-zinc-700/50 bg-zinc-900/20 p-6 md:p-8'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => audioInputRef.current?.click()}
      >
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              addFiles(e.target.files)
            }
            e.target.value = ''
          }}
          className="hidden"
        />

        {metadataLoading ? (
          <div className="flex items-center justify-center gap-3">
            <FaSpinner className="text-emerald-500 animate-spin" />
            <p className="text-sm text-zinc-300">Lendo metadados dos arquivos...</p>
          </div>
        ) : entries.length > 0 ? (
          <div className="flex items-center justify-center gap-3">
            <FaPlus className="text-emerald-500" />
            <p className="text-sm text-zinc-300">
              Clique ou arraste para adicionar mais arquivos
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <FaMusic className="text-zinc-400 text-xl" />
            </div>
            <p className="font-semibold text-lg mb-1">
              Arraste seus arquivos de áudio aqui
            </p>
            <p className="text-zinc-400 text-sm">
              ou clique para selecionar · Múltiplos arquivos · MP3, WAV, FLAC, OGG · Máx 100MB cada
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              <FaTag className="inline mr-1" />
              Artista, título e capa são extraídos automaticamente dos metadados (ID3)
            </p>
          </div>
        )}
      </div>

      {/* Content after files are added */}
      {entries.length > 0 && (
        <>
          {/* Shared Fields: Artist, Genre, Cover */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-4">
              Informações aplicadas a todas as faixas
            </p>

            <div className="flex flex-col md:flex-row gap-5">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Capa
                </label>
                <div
                  className="w-28 h-28 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors relative group"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <>
                      <img
                        src={coverPreview}
                        alt="Capa"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <FaImage className="text-white text-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <FaImage className="text-zinc-600 text-2xl" />
                      <span className="text-[10px] text-zinc-500">Opcional</span>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleCoverSelect(e.target.files[0])
                  }
                  className="hidden"
                />
                {coverFile && (
                  <button
                    type="button"
                    onClick={removeCover}
                    className="text-xs text-zinc-500 hover:text-red-400 mt-1.5 flex items-center gap-1 transition-colors"
                  >
                    <FaTimes size={10} /> Remover
                  </button>
                )}
              </div>

              {/* Artist + Genre */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Artista *
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Nome do artista (aplicado a todas)"
                    disabled={uploading}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Gênero
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">Selecione um gênero</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Album Selection */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-4">
              <FaFolderOpen className="inline mr-1.5" />
              Adicionar a um álbum (opcional)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => { setAlbumMode('none'); setSelectedAlbumId(''); setNewAlbumName('') }}
                disabled={uploading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  albumMode === 'none'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                Sem álbum
              </button>
              <button
                type="button"
                onClick={() => { setAlbumMode('existing'); setNewAlbumName('') }}
                disabled={uploading || albums.length === 0}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  albumMode === 'existing'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Álbum existente {albums.length > 0 && `(${albums.length})`}
              </button>
              <button
                type="button"
                onClick={() => { setAlbumMode('new'); setSelectedAlbumId('') }}
                disabled={uploading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  albumMode === 'new'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <FaPlus className="inline mr-1.5" size={10} />
                Novo álbum
              </button>
            </div>

            {albumMode === 'existing' && (
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                disabled={uploading}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none disabled:opacity-50"
              >
                <option value="">Selecione um álbum</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.songCount} música{a.songCount !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            )}

            {albumMode === 'new' && (
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="Nome do novo álbum"
                disabled={uploading}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
            )}
          </div>

          {/* File List - title editable per file */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-zinc-400">
                {totalFiles} faixa{totalFiles !== 1 && 's'}
                {doneCount > 0 && (
                  <span className="text-emerald-400 ml-2">
                    · {doneCount} enviada{doneCount !== 1 && 's'}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400 ml-2">
                    · {errorCount} com erro
                  </span>
                )}
              </p>
              {!uploading && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setEntries([])}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    entry.status === 'done'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : entry.status === 'error'
                        ? 'bg-red-500/5 border-red-500/20'
                        : entry.status === 'uploading'
                          ? 'bg-zinc-800/50 border-emerald-500/30 animate-pulse'
                          : 'bg-zinc-900/40 border-zinc-800/50'
                  }`}
                >
                  {/* Number */}
                  <span className="text-xs text-zinc-500 font-mono w-5 text-right flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Status icon */}
                  <div className="flex-shrink-0 w-5 flex justify-center">
                    {entry.status === 'done' ? (
                      <FaCheck className="text-emerald-500" size={13} />
                    ) : entry.status === 'error' ? (
                      <FaTimes className="text-red-400" size={13} />
                    ) : entry.status === 'uploading' ? (
                      <FaSpinner className="text-emerald-500 animate-spin" size={13} />
                    ) : (
                      <FaMusic className="text-zinc-500" size={13} />
                    )}
                  </div>

                  {/* Title + file info */}
                  <div className="flex-1 min-w-0">
                    {entry.status === 'pending' || entry.status === 'error' ? (
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateEntryTitle(entry.id, e.target.value)}
                        placeholder="Título da música *"
                        disabled={uploading}
                        className="w-full bg-transparent border-none text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 font-medium"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{entry.title}</p>
                    )}
                    <p className="text-xs text-zinc-500 truncate">
                      {entry.artist && (
                        <span className="text-zinc-400">{entry.artist} · </span>
                      )}
                      {entry.file.name} · {(entry.file.size / (1024 * 1024)).toFixed(1)} MB
                      {entry.duration > 0 &&
                        ` · ${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}`}
                      {entry.status === 'error' && entry.errorMsg && (
                        <span className="text-red-400 ml-1">· {entry.errorMsg}</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  {entry.status === 'error' && !uploading && (
                    <button
                      type="button"
                      onClick={() =>
                        setEntries((prev) =>
                          prev.map((e) =>
                            e.id === entry.id
                              ? { ...e, status: 'pending' as const, errorMsg: undefined }
                              : e
                          )
                        )
                      }
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0"
                    >
                      Reenviar
                    </button>
                  )}

                  {(entry.status === 'pending' || entry.status === 'error') && !uploading && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remover"
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          {uploading && totalFiles > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Enviando...</span>
                <span>{doneCount + errorCount} / {totalFiles}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{
                    width: `${((doneCount + errorCount) / totalFiles) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={uploading || pendingCount === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-400 font-bold py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-lg"
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Enviando {doneCount + 1} de {totalFiles}...
              </>
            ) : pendingCount === 0 && doneCount > 0 ? (
              <>
                <FaCheck />
                Tudo enviado!
              </>
            ) : (
              <>
                <FaCloudUploadAlt />
                Enviar {pendingCount} música{pendingCount !== 1 && 's'}
                {albumMode === 'new' && newAlbumName.trim() && ` → "${newAlbumName.trim()}"`}
                {albumMode === 'existing' && selectedAlbumId && ` → ${albums.find((a) => a.id === selectedAlbumId)?.name || 'álbum'}`}
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
