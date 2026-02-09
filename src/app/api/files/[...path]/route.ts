import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, statSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { Readable } from 'stream'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wma': 'audio/x-ms-wma',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/**
 * Serve arquivos locais com suporte a Range requests (necessário para áudio).
 * Rota: GET /api/files/songs/xxx.mp3, /api/files/covers/xxx.jpg, etc.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')

    // Segurança: impedir path traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads')
    const absolutePath = join(uploadDir, filePath)

    // Verificar se o arquivo está dentro do diretório de uploads
    if (!absolutePath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const stat = statSync(absolutePath)
    const fileSize = stat.size
    const mimeType = getMimeType(absolutePath)
    const rangeHeader = request.headers.get('range')

    // Suporte a Range requests para streaming de áudio
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunkSize = end - start + 1

      const stream = createReadStream(absolutePath, { start, end })
      const webStream = Readable.toWeb(stream) as ReadableStream

      return new Response(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // Resposta completa (sem Range)
    const stream = createReadStream(absolutePath)
    const webStream = Readable.toWeb(stream) as ReadableStream

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('File serve error:', error)
    return NextResponse.json({ error: 'Erro ao servir arquivo' }, { status: 500 })
  }
}
