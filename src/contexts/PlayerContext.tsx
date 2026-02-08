'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import type { PlayerSong } from '@/types'

interface PlayerContextType {
  currentSong: PlayerSong | null
  queue: PlayerSong[]
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playSong: (song: PlayerSong, queue?: PlayerSong[]) => void
  togglePlay: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  playNext: () => void
  playPrevious: () => void
  addToQueue: (song: PlayerSong) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentSong, setCurrentSong] = useState<PlayerSong | null>(null)
  const [queue, setQueue] = useState<PlayerSong[]>([])
  const currentIndexRef = useRef(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const queueRef = useRef<PlayerSong[]>([])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.7
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      const nextIndex = currentIndexRef.current + 1
      if (nextIndex < queueRef.current.length) {
        const nextSong = queueRef.current[nextIndex]
        currentIndexRef.current = nextIndex
        setCurrentSong(nextSong)
        audio.src = nextSong.audioUrl
        audio.play().catch(() => {})
        setIsPlaying(true)
      } else {
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [])

  const playSong = useCallback((song: PlayerSong, newQueue?: PlayerSong[]) => {
    if (newQueue) {
      setQueue(newQueue)
      queueRef.current = newQueue
      const index = newQueue.findIndex((s) => s.id === song.id)
      currentIndexRef.current = index >= 0 ? index : 0
    }

    setCurrentSong(song)
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [isPlaying, currentSong])

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  const playNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1
    if (nextIndex < queueRef.current.length) {
      const nextSong = queueRef.current[nextIndex]
      currentIndexRef.current = nextIndex
      setCurrentSong(nextSong)
      if (audioRef.current) {
        audioRef.current.src = nextSong.audioUrl
        audioRef.current.play().catch(() => {})
        setIsPlaying(true)
      }
    }
  }, [])

  const playPrevious = useCallback(() => {
    const prevIndex = currentIndexRef.current - 1
    if (prevIndex >= 0) {
      const prevSong = queueRef.current[prevIndex]
      currentIndexRef.current = prevIndex
      setCurrentSong(prevSong)
      if (audioRef.current) {
        audioRef.current.src = prevSong.audioUrl
        audioRef.current.play().catch(() => {})
        setIsPlaying(true)
      }
    }
  }, [])

  const addToQueue = useCallback((song: PlayerSong) => {
    setQueue((prev) => {
      const newQueue = [...prev, song]
      queueRef.current = newQueue
      return newQueue
    })
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        playSong,
        togglePlay,
        seekTo,
        setVolume,
        playNext,
        playPrevious,
        addToQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used within PlayerProvider')
  return context
}
