import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// POST - Adicionar músicas ao álbum (aceita songId único ou songIds em massa)
export async function POST(
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
      include: { _count: { select: { songs: true } } },
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

    const body = await request.json()

    // Aceitar songIds (array) ou songId (string único) para compatibilidade
    const songIds: string[] = body.songIds
      ? body.songIds
      : body.songId
        ? [body.songId]
        : []

    if (songIds.length === 0) {
      return NextResponse.json(
        { error: 'ID(s) da(s) música(s) é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se todas as músicas pertencem ao usuário
    const songs = await prisma.song.findMany({
      where: {
        id: { in: songIds },
        uploaderId: user.id,
      },
      select: { id: true },
    })

    const validSongIds = new Set(songs.map((s) => s.id))

    if (validSongIds.size === 0) {
      return NextResponse.json(
        { error: 'Nenhuma música válida encontrada' },
        { status: 404 }
      )
    }

    // Buscar músicas que já estão no álbum para não duplicar
    const existing = await prisma.albumSong.findMany({
      where: {
        albumId: params.id,
        songId: { in: Array.from(validSongIds) },
      },
      select: { songId: true },
    })

    const existingIds = new Set(existing.map((e) => e.songId))
    const newSongIds = Array.from(validSongIds).filter((id) => !existingIds.has(id))

    if (newSongIds.length === 0) {
      return NextResponse.json(
        { error: 'Todas as músicas selecionadas já estão neste álbum' },
        { status: 409 }
      )
    }

    // Adicionar em massa ao álbum
    let currentOrder = album._count.songs
    await prisma.albumSong.createMany({
      data: newSongIds.map((songId) => ({
        albumId: params.id,
        songId,
        order: currentOrder++,
      })),
    })

    const added = newSongIds.length
    const skipped = validSongIds.size - newSongIds.length

    return NextResponse.json(
      { success: true, added, skipped },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add song to album error:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar música(s) ao álbum' },
      { status: 500 }
    )
  }
}

// DELETE - Remover música do álbum
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

    const { songId } = await request.json()

    if (!songId) {
      return NextResponse.json(
        { error: 'ID da música é obrigatório' },
        { status: 400 }
      )
    }

    await prisma.albumSong.delete({
      where: {
        albumId_songId: {
          albumId: params.id,
          songId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove song from album error:', error)
    return NextResponse.json(
      { error: 'Erro ao remover música do álbum' },
      { status: 500 }
    )
  }
}
