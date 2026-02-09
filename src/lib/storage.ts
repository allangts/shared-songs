import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'

/**
 * Diretório base de uploads. Configurável via env UPLOAD_DIR.
 * Padrão: data/uploads (relativo à raiz do projeto)
 */
function getUploadDir(): string {
  return join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads')
}

/**
 * Retorna o caminho absoluto no filesystem para uma key.
 */
export function getFilePath(key: string): string {
  return join(getUploadDir(), key)
}

/**
 * Salva um arquivo no filesystem local.
 * Cria os diretórios intermediários automaticamente.
 */
export async function saveFile(
  buffer: Buffer,
  key: string,
  _contentType: string
): Promise<string> {
  const filePath = getFilePath(key)
  const dir = dirname(filePath)

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  await writeFile(filePath, buffer)
  return key
}

/**
 * Retorna a URL pública para acessar o arquivo via API.
 * Em vez de presigned URL do S3, retorna /api/files/{key}
 */
export function getFileUrl(key: string): string {
  return `/api/files/${key}`
}

/**
 * Deleta um arquivo do filesystem local.
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const filePath = getFilePath(key)
    await unlink(filePath)
  } catch (err: any) {
    // Ignora se o arquivo não existe
    if (err.code !== 'ENOENT') {
      throw err
    }
  }
}

/**
 * Verifica se um arquivo existe e retorna suas informações.
 */
export async function getFileInfo(key: string) {
  const filePath = getFilePath(key)
  try {
    const stats = await stat(filePath)
    return { exists: true, size: stats.size, path: filePath }
  } catch {
    return { exists: false, size: 0, path: filePath }
  }
}
