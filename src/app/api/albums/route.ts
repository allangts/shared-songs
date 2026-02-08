import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Listar álbuns do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const albums = await prisma.album.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { songs: true },
        },
        songs: {
          take: 1,
          orderBy: { addedAt: 'desc' },
          include: {
            song: {
              select: { coverKey: true },
            },
          },
        },
      },
    })

    const albumsWithUrls = await Promise.all(
      albums.map(async (album) => {
        let coverUrl = null

        // Usa a capa do álbum ou a capa da primeira música
        if (album.coverKey) {
          try {
            coverUrl = await getPresignedUrl(album.coverKey)
          } catch {}
        } else if (album.songs[0]?.song.coverKey) {
          try {
            coverUrl = await getPresignedUrl(album.songs[0].song.coverKey)
          } catch {}
        }

        return {
          id: album.id,
          name: album.name,
          description: album.description,
          coverUrl,
          songCount: album._count.songs,
          createdAt: album.createdAt.toISOString(),
          updatedAt: album.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json({ albums: albumsWithUrls })
  } catch (error) {
    console.error('Albums fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar álbuns' },
      { status: 500 }
    )
  }
}

// POST - Criar álbum
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome do álbum é obrigatório' },
        { status: 400 }
      )
    }

    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        album: {
          id: album.id,
          name: album.name,
          description: album.description,
          coverUrl: null,
          songCount: 0,
          createdAt: album.createdAt.toISOString(),
          updatedAt: album.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Album create error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar álbum' },
      { status: 500 }
    )
  }
}
