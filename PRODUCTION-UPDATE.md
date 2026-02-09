# 🚀 Atualização em Produção

## Opção 1: Script Automático (Recomendado)

Execute o script que faz tudo automaticamente:

```bash
cd ~/shared-songs
./scripts/update-production.sh
```

## Opção 2: Comandos Manuais

Se preferir fazer manualmente, execute na ordem:

```bash
# 1. Ir para o diretório do projeto
cd ~/shared-songs

# 2. Instalar novas dependências (jsmediatags)
npm install

# 3. Gerar Prisma Client
npx prisma generate

# 4. Fazer build da aplicação
npm run build

# 5. Reiniciar a aplicação no PM2
pm2 restart shared-songs
# ou se o nome for diferente:
pm2 restart private-songs
```

## Verificar se está funcionando

```bash
# Ver logs em tempo real
pm2 logs shared-songs

# Ver status
pm2 status

# Verificar se a aplicação está rodando
curl http://localhost:3001/api/auth/me
```

## ⚠️ Notas Importantes

- O script tenta fazer `git pull` se houver repositório, mas não é obrigatório
- Se a aplicação não estiver rodando no PM2, o script tentará iniciá-la
- O build pode levar alguns minutos dependendo do servidor
- Certifique-se de que o `.env` está configurado corretamente

## 🔍 Troubleshooting

Se der erro no build:

```bash
# Limpar cache do Next.js
rm -rf .next

# Reinstalar dependências do zero
rm -rf node_modules package-lock.json
npm install

# Tentar build novamente
npm run build
```

Se o PM2 não encontrar a aplicação:

```bash
# Listar todas as aplicações
pm2 list

# Se não existir, iniciar manualmente
cd ~/shared-songs
pm2 start npm --name "shared-songs" -- start
pm2 save
```
