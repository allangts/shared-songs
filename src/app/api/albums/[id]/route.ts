import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/storage'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Detalhe do álbum com músicas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const album = await prisma.album.findUnique({
      where: { id: params.id },
      include: {
        songs: {
          orderBy: { order: 'asc' },
          include: {
            song: {
              include: {
                _count: { select: { likes: true } },
                likes: {
                  where: { userId: user.id },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      )
    }

    if (album.userId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    let albumCoverUrl = album.coverKey ? getFileUrl(album.coverKey) : null

    const songsWithUrls = album.songs.map((albumSong) => {
      const song = albumSong.song
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

    // Se o álbum não tem capa própria, usa a capa da primeira música
    if (!albumCoverUrl && songsWithUrls.length > 0 && songsWithUrls[0].coverUrl) {
      albumCoverUrl = songsWithUrls[0].coverUrl
    }

    return NextResponse.json({
      album: {
        id: album.id,
        name: album.name,
        description: album.description,
        coverUrl: albumCoverUrl,
        songCount: songsWithUrls.length,
        songs: songsWithUrls,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Album fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar álbum' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar álbum
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const album = await prisma.album.findUnique({
      where: { id: params.id },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      )
    }

    if (album.userId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { name, description } = await request.json()

    const updated = await prisma.album.update({
      where: { id: params.id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({
      album: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Album update error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar álbum' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar álbum
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const album = await prisma.album.findUnique({
      where: { id: params.id },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Álbum não encontrado' },
        { status: 404 }
      )
    }

    if (album.userId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Deletar álbum (AlbumSong são deletados em cascade)
    await prisma.album.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Album delete error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar álbum' },
      { status: 500 }
    )
  }
}
