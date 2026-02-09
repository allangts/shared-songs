#!/bin/bash

# Script para atualizar a aplicação em produção
# Uso: ./scripts/update-production.sh

set -e

echo "🚀 Atualizando aplicação em produção..."

# Ir para o diretório do projeto
cd "$(dirname "$0")/.." || exit

# 1. Fazer pull das mudanças (se estiver usando git)
if [ -d .git ]; then
  echo "📥 Fazendo pull das mudanças..."
  git pull || echo "⚠️  Git pull falhou ou não há repositório"
fi

# 2. Instalar novas dependências
echo "📦 Instalando dependências..."
npm install

# 3. Aplicar schema do banco (se necessário)
echo "🗄️  Verificando schema do banco de dados..."
npx prisma db push --accept-data-loss || echo "⚠️  Erro ao aplicar schema (pode ser que já esteja atualizado)"

# 4. Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npx prisma generate

# 5. Build da aplicação
echo "🏗️  Fazendo build da aplicação..."
npm run build

# 6. Reiniciar PM2
echo "🔄 Reiniciando aplicação no PM2..."
pm2 restart shared-songs || pm2 restart private-songs || {
  echo "⚠️  PM2 não encontrou a aplicação. Tentando iniciar..."
  pm2 start npm --name "shared-songs" -- start || pm2 start npm --name "private-songs" -- start
}

echo ""
echo "✅ Atualização concluída! ✅"
echo ""
echo "📊 Status da aplicação:"
pm2 status
