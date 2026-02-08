'use client'

import { useState, useRef, useCallback } from 'react'
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
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { GENRES } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface FileEntry {
  id: string
  file: File
  title: string
  artist: string
  genre: string
  duration: number
  coverFile: File | null
  coverPreview: string | null
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

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const audioInputRef = useRef<HTMLInputElement>(null)

  const [entries, setEntries] = useState<FileEntry[]>([])
  const [commonArtist, setCommonArtist] = useState('')
  const [commonGenre, setCommonGenre] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Stats
  const totalFiles = entries.length
  const doneCount = entries.filter((e) => e.status === 'done').length
  const errorCount = entries.filter((e) => e.status === 'error').length

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

      const newEntries: FileEntry[] = await Promise.all(
        validFiles.map(async (file) => {
          const duration = await getDuration(file)
          return {
            id: generateEntryId(),
            file,
            title: titleFromFilename(file.name),
            artist: commonArtist,
            genre: commonGenre,
            duration,
            coverFile: null,
            coverPreview: null,
            status: 'pending' as const,
          }
        })
      )

      setEntries((prev) => [...prev, ...newEntries])

      if (validFiles.length === 1) {
        toast.success('1 arquivo adicionado')
      } else {
        toast.success(`${validFiles.length} arquivos adicionados`)
      }
    },
    [commonArtist, commonGenre]
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
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id)
      if (entry?.coverPreview) URL.revokeObjectURL(entry.coverPreview)
      return prev.filter((e) => e.id !== id)
    })
  }

  const updateEntry = (id: string, updates: Partial<FileEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    )
  }

  const handleCoverForEntry = (id: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida')
      return
    }
    const preview = URL.createObjectURL(file)
    updateEntry(id, { coverFile: file, coverPreview: preview })
  }

  const removeCoverForEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id)
    if (entry?.coverPreview) URL.revokeObjectURL(entry.coverPreview)
    updateEntry(id, { coverFile: null, coverPreview: null })
  }

  // Apply common artist to all pending entries
  const applyCommonArtist = () => {
    if (!commonArtist.trim()) return
    setEntries((prev) =>
      prev.map((e) =>
        e.status === 'pending' ? { ...e, artist: commonArtist } : e
      )
    )
    toast.success('Artista aplicado a todas as faixas')
  }

  // Apply common genre to all pending entries
  const applyCommonGenre = () => {
    if (!commonGenre) return
    setEntries((prev) =>
      prev.map((e) =>
        e.status === 'pending' ? { ...e, genre: commonGenre } : e
      )
    )
    toast.success('Gênero aplicado a todas as faixas')
  }

  const handleUploadAll = async () => {
    const pendingEntries = entries.filter((e) => e.status === 'pending')
    if (pendingEntries.length === 0) {
      toast.error('Nenhum arquivo pendente para enviar')
      return
    }

    // Validate all entries
    for (const entry of pendingEntries) {
      if (!entry.title.trim()) {
        toast.error(`Preencha o título para "${entry.file.name}"`)
        return
      }
      if (!entry.artist.trim()) {
        toast.error(`Preencha o artista para "${entry.file.name}"`)
        return
      }
    }

    setUploading(true)

    let successCount = 0
    let failCount = 0

    for (const entry of pendingEntries) {
      updateEntry(entry.id, { status: 'uploading' })

      try {
        const formData = new FormData()
        formData.append('audio', entry.file)
        formData.append('title', entry.title.trim())
        formData.append('artist', entry.artist.trim())
        formData.append('genre', entry.genre)
        formData.append('duration', String(entry.duration))
        if (entry.coverFile) {
          formData.append('cover', entry.coverFile)
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Erro ao enviar')
        }

        updateEntry(entry.id, { status: 'done' })
        successCount++
      } catch (err: any) {
        updateEntry(entry.id, {
          status: 'error',
          errorMsg: err.message || 'Erro ao enviar',
        })
        failCount++
      }
    }

    setUploading(false)

    if (failCount === 0) {
      toast.success(
        successCount === 1
          ? 'Música enviada com sucesso! 🎵'
          : `${successCount} músicas enviadas com sucesso! 🎵`
      )
      // Clear done entries after a short delay
      setTimeout(() => {
        router.push('/library')
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
          <Link
            href="/register"
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-6 rounded-full text-sm transition-all hover:scale-105"
          >
            Registrar
          </Link>
        </div>
      </div>
    )
  }

  const pendingCount = entries.filter((e) => e.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Upload de Músicas</h1>
        <p className="text-zinc-400 mt-2">
          Adicione músicas à sua biblioteca pessoal — selecione vários arquivos de uma vez
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
            // Reset so the same files can be selected again
            e.target.value = ''
          }}
          className="hidden"
        />

        {entries.length > 0 ? (
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
          </div>
        )}
      </div>

      {/* Common fields + File list */}
      {entries.length > 0 && (
        <>
          {/* Common Artist / Genre */}
          {pendingCount > 1 && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 mb-6">
              <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-3">
                Aplicar a todas as faixas pendentes
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commonArtist}
                    onChange={(e) => setCommonArtist(e.target.value)}
                    placeholder="Artista em comum"
                    className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={applyCommonArtist}
                    disabled={!commonArtist.trim()}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-500 font-medium py-2 px-3 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    Aplicar
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={commonGenre}
                    onChange={(e) => setCommonGenre(e.target.value)}
                    className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                  >
                    <option value="">Gênero em comum</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={applyCommonGenre}
                    disabled={!commonGenre}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-emerald-500 font-medium py-2 px-3 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* File List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">
                {totalFiles} arquivo{totalFiles !== 1 && 's'}
                {doneCount > 0 && (
                  <span className="text-emerald-400 ml-2">
                    · {doneCount} enviado{doneCount !== 1 && 's'}
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
                  onClick={() => {
                    entries.forEach((e) => {
                      if (e.coverPreview) URL.revokeObjectURL(e.coverPreview)
                    })
                    setEntries([])
                  }}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`rounded-xl border transition-all ${
                  entry.status === 'done'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : entry.status === 'error'
                      ? 'bg-red-500/5 border-red-500/20'
                      : entry.status === 'uploading'
                        ? 'bg-zinc-800/50 border-emerald-500/30 animate-pulse'
                        : 'bg-zinc-900/40 border-zinc-800/50'
                }`}
              >
                <div className="p-4">
                  {/* Header row: number, filename, status, remove */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-zinc-500 font-mono w-6 text-right flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* Status icon */}
                    {entry.status === 'done' ? (
                      <FaCheck className="text-emerald-500 flex-shrink-0" size={14} />
                    ) : entry.status === 'error' ? (
                      <FaTimes className="text-red-400 flex-shrink-0" size={14} />
                    ) : entry.status === 'uploading' ? (
                      <FaSpinner className="text-emerald-500 animate-spin flex-shrink-0" size={14} />
                    ) : (
                      <FaMusic className="text-zinc-500 flex-shrink-0" size={14} />
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {(entry.file.size / (1024 * 1024)).toFixed(1)} MB
                        {entry.duration > 0 &&
                          ` · ${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, '0')}`}
                      </p>
                    </div>

                    {entry.status === 'error' && (
                      <p className="text-xs text-red-400 flex-shrink-0">{entry.errorMsg}</p>
                    )}

                    {(entry.status === 'pending' || entry.status === 'error') && !uploading && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remover"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>

                  {/* Editable fields (only for pending/error) */}
                  {(entry.status === 'pending' || entry.status === 'error') && (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2 ml-9">
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                        placeholder="Título *"
                        disabled={uploading}
                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={entry.artist}
                        onChange={(e) => updateEntry(entry.id, { artist: e.target.value })}
                        placeholder="Artista *"
                        disabled={uploading}
                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                      />
                      <select
                        value={entry.genre}
                        onChange={(e) => updateEntry(entry.id, { genre: e.target.value })}
                        disabled={uploading}
                        className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none disabled:opacity-50"
                      >
                        <option value="">Gênero</option>
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>

                      {/* Cover */}
                      <div className="flex items-center gap-2">
                        {entry.coverPreview ? (
                          <div className="relative w-9 h-9 flex-shrink-0">
                            <img
                              src={entry.coverPreview}
                              alt=""
                              className="w-full h-full rounded-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeCoverForEntry(entry.id)}
                              className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                              title="Remover capa"
                            >
                              <FaTimes className="text-white" size={8} />
                            </button>
                          </div>
                        ) : (
                          <label className="w-9 h-9 flex-shrink-0 rounded-md bg-zinc-800 border border-zinc-700/50 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors">
                            <FaImage className="text-zinc-600 text-xs" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleCoverForEntry(entry.id, e.target.files[0])
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Retry for errored entries */}
                  {entry.status === 'error' && !uploading && (
                    <div className="ml-9 mt-2">
                      <button
                        type="button"
                        onClick={() => updateEntry(entry.id, { status: 'pending', errorMsg: undefined })}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Marcar para reenvio
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload progress bar */}
          {uploading && totalFiles > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Enviando...</span>
                <span>{doneCount + errorCount} / {entries.filter(e => e.status !== 'done' || e.status === 'done').length}</span>
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
              </>
            )}
          </button>
        </>
      )}
    </div>
  )
}
