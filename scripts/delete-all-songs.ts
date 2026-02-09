/**
 * Script para excluir TODAS as músicas, álbuns, likes e arquivos de mídia.
 *
 * Uso:
 *   npx tsx scripts/delete-all-songs.ts
 *
 * Isso vai:
 *   1. Deletar todos os registros de AlbumSong, Like, Song, Album do banco
 *   2. Apagar todos os arquivos locais em data/uploads/
 */

import { PrismaClient } from '@prisma/client'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('⚠️  Este script vai EXCLUIR TUDO: músicas, álbuns, likes e arquivos.\n')

  // Contar registros
  const songCount = await prisma.song.count()
  const albumCount = await prisma.album.count()
  const likeCount = await prisma.like.count()
  const albumSongCount = await prisma.albumSong.count()

  console.log(`📊 Registros encontrados:`)
  console.log(`   Músicas:      ${songCount}`)
  console.log(`   Álbuns:       ${albumCount}`)
  console.log(`   AlbumSongs:   ${albumSongCount}`)
  console.log(`   Likes:        ${likeCount}`)
  console.log()

  if (songCount === 0 && albumCount === 0) {
    console.log('✅ Nada para excluir. Banco já está limpo.')
    return
  }

  // Deletar na ordem correta (respeitar FKs)
  console.log('🗑️  Deletando AlbumSong...')
  const deletedAlbumSongs = await prisma.albumSong.deleteMany()
  console.log(`   ${deletedAlbumSongs.count} registros deletados`)

  console.log('🗑️  Deletando Likes...')
  const deletedLikes = await prisma.like.deleteMany()
  console.log(`   ${deletedLikes.count} registros deletados`)

  console.log('🗑️  Deletando Songs...')
  const deletedSongs = await prisma.song.deleteMany()
  console.log(`   ${deletedSongs.count} registros deletados`)

  console.log('🗑️  Deletando Albums...')
  const deletedAlbums = await prisma.album.deleteMany()
  console.log(`   ${deletedAlbums.count} registros deletados`)

  // Limpar diretório de uploads locais
  const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads')
  if (existsSync(uploadDir)) {
    console.log(`\n🗑️  Removendo arquivos em ${uploadDir}...`)
    rmSync(uploadDir, { recursive: true, force: true })
    console.log('   Diretório de uploads removido')
  } else {
    console.log(`\n📁 Diretório ${uploadDir} não existe (nada para remover)`)
  }

  console.log('\n✅ Tudo excluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
