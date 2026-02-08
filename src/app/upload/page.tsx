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
} from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import { GENRES } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [genre, setGenre] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleAudioSelect = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Por favor, selecione um arquivo de áudio válido')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 100MB')
      return
    }

    setAudioFile(file)

    // Extract duration
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(Math.round(audio.duration))
      URL.revokeObjectURL(audio.src)
    })

    // Auto-fill title from filename
    if (!title) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(name)
    }
  }, [title])

  const handleCoverSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }, [])

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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith('audio/')) {
          handleAudioSelect(file)
        }
      }
    },
    [handleAudioSelect]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      toast.error('Selecione um arquivo de áudio')
      return
    }
    if (!title.trim()) {
      toast.error('Preencha o título da música')
      return
    }
    if (!artist.trim()) {
      toast.error('Preencha o nome do artista')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('title', title.trim())
      formData.append('artist', artist.trim())
      formData.append('genre', genre)
      formData.append('duration', String(audioDuration))
      if (coverFile) {
        formData.append('cover', coverFile)
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      toast.success('Música enviada com sucesso! 🎵')
      router.push('/library')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Upload de Música</h1>
        <p className="text-zinc-400 mt-2">
          Compartilhe suas músicas com toda a comunidade
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Audio Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/5'
              : audioFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
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
            onChange={(e) =>
              e.target.files?.[0] && handleAudioSelect(e.target.files[0])
            }
            className="hidden"
          />

          {audioFile ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <FaCheck className="text-emerald-500 text-xl" />
              </div>
              <p className="font-semibold text-lg">{audioFile.name}</p>
              <p className="text-zinc-400 text-sm mt-1">
                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                {audioDuration > 0 &&
                  ` · ${Math.floor(audioDuration / 60)}:${(audioDuration % 60).toString().padStart(2, '0')}`}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setAudioFile(null)
                  setAudioDuration(0)
                }}
                className="mt-3 text-sm text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <FaTimes size={12} /> Remover
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <FaMusic className="text-zinc-400 text-xl" />
              </div>
              <p className="font-semibold text-lg mb-1">
                Arraste um arquivo de áudio aqui
              </p>
              <p className="text-zinc-400 text-sm">
                ou clique para selecionar · MP3, WAV, FLAC, OGG · Máx 100MB
              </p>
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Título da Música *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da música"
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Artista *
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Nome do artista"
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Gênero
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none"
          >
            <option value="">Selecione um gênero</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Capa (opcional)
          </label>
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors flex-shrink-0"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Capa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaImage className="text-zinc-600 text-2xl" />
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
            <div className="text-sm text-zinc-400">
              <p>Clique para selecionar uma imagem de capa.</p>
              <p className="text-zinc-500">JPG, PNG · Recomendado 500x500px</p>
              {coverFile && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null)
                    setCoverPreview(null)
                  }}
                  className="text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
                >
                  <FaTimes size={10} /> Remover capa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || !audioFile}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black disabled:text-zinc-400 font-bold py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-lg"
        >
          {uploading ? (
            <>
              <FaSpinner className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <FaCloudUploadAlt />
              Enviar Música
            </>
          )}
        </button>
      </form>
    </div>
  )
}
