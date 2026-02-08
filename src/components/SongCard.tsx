'use client'

import { FaPlay, FaPause } from 'react-icons/fa'
import { usePlayer } from '@/contexts/PlayerContext'
import type { PlayerSong } from '@/types'

interface SongCardProps {
  song: PlayerSong & { plays?: number; uploader?: { name: string } }
  songs?: PlayerSong[]
}

export default function SongCard({ song, songs }: SongCardProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer()
  const isCurrentSong = currentSong?.id === song.id
  const isCurrentPlaying = isCurrentSong && isPlaying

  const handlePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isCurrentSong) {
      togglePlay()
    } else {
      playSong(song, songs || [song])
    }
  }

  return (
    <div
      className="group bg-zinc-800/30 hover:bg-zinc-800/70 rounded-xl p-3 md:p-4 transition-all duration-300 cursor-pointer"
      onClick={() => handlePlay()}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg shadow-black/30">
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center">
            <FaPlay className="text-white/20 text-3xl md:text-4xl" />
          </div>
        )}

        {/* Play button overlay */}
        <button
          className={`absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all duration-300 ${
            isCurrentPlaying
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          } hover:bg-emerald-400 hover:scale-110`}
          onClick={handlePlay}
        >
          {isCurrentPlaying ? (
            <FaPause className="text-black" size={14} />
          ) : (
            <FaPlay className="text-black ml-0.5" size={14} />
          )}
        </button>

        {/* Now playing indicator */}
        {isCurrentPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 bg-emerald-500 rounded-full animate-pulse h-1/3" />
              <div
                className="w-0.5 bg-emerald-500 rounded-full animate-pulse h-full"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="w-0.5 bg-emerald-500 rounded-full animate-pulse h-2/3"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">
              Tocando
            </span>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-sm md:text-base truncate leading-tight">
        {isCurrentSong ? (
          <span className="text-emerald-500">{song.title}</span>
        ) : (
          song.title
        )}
      </h3>
      <p className="text-xs md:text-sm text-zinc-400 truncate mt-1">
        {song.artist}
        {song.uploader && (
          <span className="text-zinc-500"> · {song.uploader.name}</span>
        )}
      </p>
    </div>
  )
}
