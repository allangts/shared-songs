#!/bin/bash

# Script para aplicar o schema do Prisma no banco de dados
# Uso: ./scripts/setup-database.sh

set -e

echo "🗄️  Aplicando schema do Prisma no banco de dados..."

# Ir para o diretório do projeto
cd "$(dirname "$0")/.." || exit

# Verificar se o .env existe
if [ ! -f .env ]; then
  echo "❌ Arquivo .env não encontrado!"
  echo "   Crie o arquivo .env com a variável DATABASE_URL"
  exit 1
fi

# Carregar variáveis do .env
export $(grep -v '^#' .env | xargs)

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não está definida no .env!"
  exit 1
fi

echo "📋 Schema atual:"
echo "   - User (usuários)"
echo "   - Song (músicas)"
echo "   - Album (álbuns) ← Será criado"
echo "   - AlbumSong (relação álbum-música) ← Será criado"
echo "   - Like (favoritos)"
echo ""

# Aplicar schema usando db push (não requer shadow database)
echo "🔄 Aplicando schema no banco de dados..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ Schema aplicado com sucesso!"
echo ""
echo "🔧 Gerando Prisma Client..."
npx prisma generate

echo ""
echo "✅ Banco de dados configurado!"
