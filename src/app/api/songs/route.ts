import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/storage'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Autenticação obrigatória — cada usuário só vê suas próprias músicas
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para acessar suas músicas.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'recent'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const genre = searchParams.get('genre')
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites') === 'true'

    // Sempre filtra pelo usuário logado
    const where: any = {
      uploaderId: user.id,
    }

    if (genre) {
      where.genre = genre
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (favorites) {
      where.likes = {
        some: {
          userId: user.id,
        },
      }
    }

    // Sort order
    const orderBy =
      sort === 'popular'
        ? { plays: 'desc' as const }
        : { createdAt: 'desc' as const }

    const songs = await prisma.song.findMany({
      where,
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    })

    // Gerar URLs locais para cada música
    const songsWithUrls = songs.map((song) => {
      const audioUrl = getFileUrl(song.audioKey)
      const coverUrl = song.coverKey ? getFileUrl(song.coverKey) : null

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        duration: song.duration,
        audioUrl,
        coverUrl,
        plays: song.plays,
        likes: song._count.likes,
        isFavorite: song.likes.length > 0,
        uploaderId: song.uploaderId,
        createdAt: song.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ songs: songsWithUrls })
  } catch (error) {
    console.error('Songs fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar músicas' },
      { status: 500 }
    )
  }
}
