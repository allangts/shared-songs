/**
 * Script para excluir TODAS as contas EXCETO allandiegoafonsoalmeida@gmail.com
 *
 * Uso:
 *   npx tsx scripts/delete-other-accounts.ts
 *
 * Isso vai:
 *   1. Deletar todos os registros relacionados (AlbumSong, Like, Song, Album) dos outros usuários
 *   2. Apagar os arquivos de mídia desses usuários
 *   3. Deletar as contas dos outros usuários
 *
 * A conta allandiegoafonsoalmeida@gmail.com e todos os seus dados serão preservados.
 */

import { PrismaClient } from '@prisma/client'
import { rmSync, existsSync } from 'fs'
import { join } from 'path'

const KEEP_EMAIL = 'allandiegoafonsoalmeida@gmail.com'

const prisma = new PrismaClient()

/**
 * Tenta deletar registros de uma tabela, ignora se a tabela não existir
 */
async function safeDeleteMany(
  model: any,
  where: any,
  modelName: string
): Promise<number> {
  try {
    const result = await model.deleteMany({ where })
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
  console.log(`⚠️  Este script vai EXCLUIR todas as contas EXCETO: ${KEEP_EMAIL}\n`)

  // Buscar a conta que será mantida
  const keepUser = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
  })

  if (!keepUser) {
    console.log(`❌ Conta ${KEEP_EMAIL} não encontrada no banco de dados.`)
    console.log('   Nenhuma ação será tomada.')
    return
  }

  console.log(`✅ Conta preservada: ${keepUser.name} (${keepUser.email})\n`)

  // Contar usuários que serão excluídos
  const usersToDelete = await prisma.user.findMany({
    where: { id: { not: keepUser.id } },
    select: { id: true, name: true, email: true },
  })

  if (usersToDelete.length === 0) {
    console.log('✅ Nenhuma outra conta encontrada. Nada para excluir.')
    return
  }

  console.log(`🗑️  Contas que serão excluídas (${usersToDelete.length}):`)
  for (const u of usersToDelete) {
    console.log(`   - ${u.name} (${u.email})`)
  }
  console.log()

  const userIds = usersToDelete.map((u) => u.id)

  // Buscar arquivos das músicas desses usuários para deletar do disco
  let songsToDelete: Array<{ audioKey: string; coverKey: string | null }> = []
  try {
    songsToDelete = await prisma.song.findMany({
      where: { uploaderId: { in: userIds } },
      select: { audioKey: true, coverKey: true },
    })
  } catch (error: any) {
    if (error.code !== 'P2021') {
      // Se não for erro de tabela inexistente, relança
      throw error
    }
    // Tabela Song não existe, continuar
  }

  // Deletar registros do banco (cascade cuida de AlbumSong e Like)
  console.log('🗑️  Deletando dados dos outros usuários...')

  const deletedSongs = await safeDeleteMany(
    prisma.song,
    { uploaderId: { in: userIds } },
    'Song'
  )
  if (deletedSongs > 0) {
    console.log(`   ${deletedSongs} música(s) deletada(s)`)
  }

  const deletedAlbums = await safeDeleteMany(
    prisma.album,
    { userId: { in: userIds } },
    'Album'
  )
  if (deletedAlbums > 0) {
    console.log(`   ${deletedAlbums} álbum(ns) deletado(s)`)
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  })
  console.log(`   ${deletedUsers.count} conta(s) deletada(s)`)

  // Deletar arquivos do disco
  const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads')
  let filesDeleted = 0

  for (const song of songsToDelete) {
    const audioPath = join(uploadDir, song.audioKey)
    if (existsSync(audioPath)) {
      rmSync(audioPath, { force: true })
      filesDeleted++
    }

    if (song.coverKey) {
      const coverPath = join(uploadDir, song.coverKey)
      if (existsSync(coverPath)) {
        rmSync(coverPath, { force: true })
        filesDeleted++
      }
    }
  }

  if (filesDeleted > 0) {
    console.log(`   ${filesDeleted} arquivo(s) removido(s) do disco`)
  }

  console.log('\n✅ Concluído! Apenas a conta preservada permanece.')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
