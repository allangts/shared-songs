import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPresignedUrl } from '@/lib/s3'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação obrigatória
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const song = await prisma.song.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }

    // Verificar que a música pertence ao usuário
    if (song.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Increment play count
    await prisma.song.update({
      where: { id: params.id },
      data: { plays: { increment: 1 } },
    })

    // Generate presigned URLs
    const audioUrl = await getPresignedUrl(song.audioKey)
    let coverUrl = null
    if (song.coverKey) {
      coverUrl = await getPresignedUrl(song.coverKey)
    }

    return NextResponse.json({
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        genre: song.genre,
        duration: song.duration,
        audioUrl,
        coverUrl,
        plays: song.plays + 1,
        likes: song._count.likes,
        uploaderId: song.uploaderId,
        createdAt: song.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Song fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar música' },
      { status: 500 }
    )
  }
}

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

    const song = await prisma.song.findUnique({
      where: { id: params.id },
    })

    if (!song) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }

    if (song.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Deletar likes associados e depois a música
    await prisma.like.deleteMany({ where: { songId: params.id } })
    await prisma.song.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Song delete error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar música' },
      { status: 500 }
    )
  }
}
