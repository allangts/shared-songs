export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface Song {
  id: string
  title: string
  artist: string
  genre: string | null
  duration: number
  audioUrl: string
  coverUrl: string | null
  plays: number
  likes: number
  uploaderId: string
  uploader?: {
    id: string
    name: string
  }
  createdAt: string
}

export interface Album {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  songCount: number
  songs?: Song[]
  createdAt: string
  updatedAt: string
}

export interface PlayerSong {
  id: string
  title: string
  artist: string
  coverUrl: string | null
  audioUrl: string
  duration: number
}

export const GENRES = [
  'Pop',
  'Rock',
  'Hip Hop',
  'R&B',
  'Eletrônica',
  'Jazz',
  'Clássica',
  'Country',
  'Indie',
  'Metal',
  'Reggae',
  'Sertanejo',
  'Funk',
  'MPB',
  'Lo-fi',
  'Outro',
] as const

export type Genre = (typeof GENRES)[number]
