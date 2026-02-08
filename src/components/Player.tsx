'use client'

import { usePlayer } from '@/contexts/PlayerContext'
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaVolumeUp,
  FaVolumeMute,
  FaVolumeDown,
} from 'react-icons/fa'

function formatTime(seconds: number) {
  if (isNaN(seconds) || seconds === Infinity) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function Player() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayer()

  if (!currentSong) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 to-zinc-900/95 backdrop-blur-lg border-t border-zinc-800/50 z-40">
      {/* Mobile Layout */}
      <div className="md:hidden px-3 pt-2 pb-2">
        {/* Progress bar (thin, at the very top) */}
        <div className="w-full h-1 bg-zinc-700 rounded-full mb-2 -mt-1">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex-shrink-0 overflow-hidden shadow-lg">
            {currentSong.coverUrl ? (
              <img
                src={currentSong.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-cyan-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {currentSong.title}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {currentSong.artist}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={playPrevious}
              className="p-2 text-zinc-400 active:text-white"
            >
              <FaStepBackward size={14} />
            </button>
            <button
              onClick={togglePlay}
              className="p-2 text-white active:scale-95"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
            <button
              onClick={playNext}
              className="p-2 text-zinc-400 active:text-white"
            >
              <FaStepForward size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-3 items-center gap-4 px-4 py-3 max-w-screen-2xl mx-auto">
        {/* Song Info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-md flex-shrink-0 overflow-hidden shadow-lg">
            {currentSong.coverUrl ? (
              <img
                src={currentSong.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-cyan-500" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate hover:underline cursor-pointer">
              {currentSong.title}
            </p>
            <p className="text-xs text-zinc-400 truncate hover:underline cursor-pointer">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-5">
            <button
              onClick={playPrevious}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <FaStepBackward size={14} />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <FaPause size={14} className="text-black" />
              ) : (
                <FaPlay size={14} className="text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={playNext}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <FaStepForward size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-lg">
            <span className="text-[11px] text-zinc-400 w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-[11px] text-zinc-400 w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {volume === 0 ? (
              <FaVolumeMute size={16} />
            ) : volume < 0.5 ? (
              <FaVolumeDown size={16} />
            ) : (
              <FaVolumeUp size={16} />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-28"
          />
        </div>
      </div>
    </div>
  )
}
