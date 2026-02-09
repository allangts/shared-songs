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

/**
 * Tenta contar registros de uma tabela, retorna 0 se a tabela não existir
 */
async function safeCount(model: any, modelName: string): Promise<number> {
  try {
    return await model.count()
  } catch (error: any) {
    if (error.code === 'P2021') {
      // Tabela não existe
      return 0
    }
    throw error
  }
}

/**
 * Tenta deletar registros de uma tabela, ignora se a tabela não existir
 */
async function safeDeleteMany(model: any, modelName: string): Promise<number> {
  try {
    const result = await model.deleteMany()
    return result.count || 0
  } catch (error: any) {
    if (error.code === 'P2021') {
      // Tabela não existe
      return 0
    }
    throw error
  }
}

async function main() {
  console.log('⚠️  Este script vai EXCLUIR TUDO: músicas, álbuns, likes e arquivos.\n')

  // Contar registros (ignora tabelas que não existem)
  const songCount = await safeCount(prisma.song, 'Song')
  const albumCount = await safeCount(prisma.album, 'Album')
  const likeCount = await safeCount(prisma.like, 'Like')
  const albumSongCount = await safeCount(prisma.albumSong, 'AlbumSong')

  console.log(`📊 Registros encontrados:`)
  console.log(`   Músicas:      ${songCount}`)
  console.log(`   Álbuns:       ${albumCount}`)
  console.log(`   AlbumSongs:   ${albumSongCount}`)
  console.log(`   Likes:        ${likeCount}`)
  console.log()

  if (songCount === 0 && albumCount === 0 && likeCount === 0 && albumSongCount === 0) {
    console.log('✅ Nada para excluir. Banco já está limpo.')
  } else {
    // Deletar na ordem correta (respeitar FKs)
    console.log('🗑️  Deletando registros...')

    const deletedAlbumSongs = await safeDeleteMany(prisma.albumSong, 'AlbumSong')
    if (deletedAlbumSongs > 0) {
      console.log(`   AlbumSong: ${deletedAlbumSongs} registros deletados`)
    }

    const deletedLikes = await safeDeleteMany(prisma.like, 'Like')
    if (deletedLikes > 0) {
      console.log(`   Likes: ${deletedLikes} registros deletados`)
    }

    const deletedSongs = await safeDeleteMany(prisma.song, 'Song')
    if (deletedSongs > 0) {
      console.log(`   Songs: ${deletedSongs} registros deletados`)
    }

    const deletedAlbums = await safeDeleteMany(prisma.album, 'Album')
    if (deletedAlbums > 0) {
      console.log(`   Albums: ${deletedAlbums} registros deletados`)
    }
  }

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
