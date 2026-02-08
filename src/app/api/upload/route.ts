import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToS3 } from '@/lib/s3'
import { getUserFromRequest } from '@/lib/auth'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para enviar músicas.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const audio = formData.get('audio') as File | null
    const cover = formData.get('cover') as File | null
    const title = formData.get('title') as string
    const artist = formData.get('artist') as string
    const genre = formData.get('genre') as string
    const duration = parseInt(formData.get('duration') as string) || 0

    // Validation
    if (!audio) {
      return NextResponse.json(
        { error: 'Arquivo de áudio é obrigatório' },
        { status: 400 }
      )
    }

    if (!title?.trim() || !artist?.trim()) {
      return NextResponse.json(
        { error: 'Título e artista são obrigatórios' },
        { status: 400 }
      )
    }

    if (!audio.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'O arquivo deve ser um áudio válido' },
        { status: 400 }
      )
    }

    // Upload audio to S3
    const audioBuffer = Buffer.from(await audio.arrayBuffer())
    const audioExt = audio.name.split('.').pop() || 'mp3'
    const audioKey = `songs/${randomUUID()}.${audioExt}`

    await uploadToS3(audioBuffer, audioKey, audio.type)

    // Upload cover to S3 (if provided)
    let coverKey: string | null = null
    if (cover && cover.size > 0 && cover.type.startsWith('image/')) {
      const coverBuffer = Buffer.from(await cover.arrayBuffer())
      const coverExt = cover.name.split('.').pop() || 'jpg'
      coverKey = `covers/${randomUUID()}.${coverExt}`

      await uploadToS3(coverBuffer, coverKey, cover.type)
    }

    // Save to database
    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        artist: artist.trim(),
        genre: genre || null,
        duration,
        audioKey,
        coverKey,
        uploaderId: user.id,
      },
      include: {
        uploader: {
          select: { name: true, id: true },
        },
      },
    })

    return NextResponse.json(
      {
        song: {
          id: song.id,
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          duration: song.duration,
          uploader: song.uploader,
          createdAt: song.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload da música' },
      { status: 500 }
    )
  }
}
