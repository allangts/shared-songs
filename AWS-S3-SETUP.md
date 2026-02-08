# 🪣 Guia Completo - Configuração AWS S3

Este guia vai te ajudar a configurar o Amazon S3 para armazenar os arquivos de áudio e capas de músicas.

---

## 📋 Pré-requisitos

- Conta AWS (se não tiver, crie em: https://aws.amazon.com/)
- Acesso ao Console AWS

---

## Passo 1: Criar o Bucket S3

1. **Acesse o Console AWS:**
   - Vá para: https://console.aws.amazon.com/s3/
   - Faça login na sua conta AWS

2. **Criar um novo bucket:**
   - Clique em **"Create bucket"**
   - **Bucket name:** Escolha um nome único (ex: `shared-songs-music-2024`)
     - ⚠️ O nome deve ser único globalmente na AWS
     - Use apenas letras minúsculas, números e hífens
   - **AWS Region:** Escolha a região mais próxima (ex: `us-east-1`, `sa-east-1` para Brasil)
   - **Object Ownership:** Deixe como padrão (ACLs disabled)
   - **Block Public Access settings:** 
     - ✅ **Marque "Block all public access"** (vamos usar presigned URLs, não precisa ser público)
   - **Bucket Versioning:** Desabilitado (padrão)
   - **Default encryption:** Habilitado (recomendado)
   - Clique em **"Create bucket"**

3. **Anotar informações:**
   - ✅ Nome do bucket: `_________________`
   - ✅ Região: `_________________`

---

## Passo 2: Criar Usuário IAM com Acesso ao S3

1. **Acesse o IAM:**
   - Vá para: https://console.aws.amazon.com/iam/
   - No menu lateral, clique em **"Users"**

2. **Criar novo usuário:**
   - Clique em **"Create user"**
   - **User name:** `shared-songs-s3-user`
   - **Select AWS credential type:** Marque apenas **"Access key - Programmatic access"**
   - Clique em **"Next: Permissions"**

3. **Configurar permissões:**
   - Clique em **"Attach policies directly"**
   - Procure e marque: **"AmazonS3FullAccess"** (ou crie uma política customizada mais restritiva)
   - Clique em **"Next: Tags"** (pode pular)
   - Clique em **"Next: Review"**
   - Clique em **"Create user"**

4. **Salvar credenciais:**
   - ⚠️ **IMPORTANTE:** Esta é a única vez que você verá a Secret Access Key!
   - **Access Key ID:** `_________________`
   - **Secret Access Key:** `_________________`
   - Clique em **"Download .csv"** para salvar as credenciais
   - Ou copie e cole em um local seguro

---

## Passo 3: (Opcional) Criar Política Customizada Mais Restritiva

Se quiser ser mais seguro e dar apenas as permissões necessárias:

1. **Criar política:**
   - No IAM, vá em **"Policies"**
   - Clique em **"Create policy"**
   - Vá na aba **"JSON"** e cole:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::NOME-DO-SEU-BUCKET/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::NOME-DO-SEU-BUCKET"
        }
    ]
}
```

2. **Substituir `NOME-DO-SEU-BUCKET`** pelo nome real do seu bucket
3. **Nome da política:** `SharedSongsS3Policy`
4. **Criar a política**
5. **Anexar ao usuário:**
   - Volte em **"Users"** → `shared-songs-s3-user`
   - Aba **"Permissions"** → **"Add permissions"** → **"Attach policies directly"**
   - Marque a política que você criou
   - Clique em **"Add permissions"**

---

## Passo 4: Configurar Variáveis de Ambiente

Na VM, edite o arquivo `.env`:

```bash
cd ~/shared-songs
nano .env
```

Atualize as seguintes linhas com os valores reais:

```env
# AWS S3
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"           # ← Cole o Access Key ID aqui
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"  # ← Cole o Secret Access Key aqui
AWS_REGION="us-east-1"                            # ← A região do seu bucket
AWS_S3_BUCKET="shared-songs-music-2024"           # ← O nome do seu bucket
```

**Exemplo completo do `.env`:**

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://usuario:senha@localhost:5432/shared_songs?schema=public"

# Auth
JWT_SECRET="sua-chave-secreta-jwt-aqui"

# AWS S3
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="shared-songs-music-2024"

# Production
NODE_ENV=production
```

Salve o arquivo (Ctrl+X, Y, Enter).

---

## Passo 5: Reiniciar a Aplicação

Após atualizar o `.env`, reinicie a aplicação para carregar as novas variáveis:

```bash
pm2 restart shared-songs
pm2 logs shared-songs
```

---

## Passo 6: Testar Upload

1. Acesse a aplicação: `https://sharedsongs.essentialcode.com.br`
2. Faça login ou crie uma conta
3. Vá em **"Upload"**
4. Tente fazer upload de uma música de teste
5. Verifique os logs: `pm2 logs shared-songs`

Se funcionar, você verá a música aparecer na biblioteca!

---

## 🔍 Troubleshooting

### Erro: "InvalidAccessKeyId"
- ✅ Verifique se copiou o Access Key ID corretamente (sem espaços)
- ✅ Verifique se o usuário IAM existe e tem as permissões corretas

### Erro: "Access Denied"
- ✅ Verifique se a política IAM está anexada ao usuário
- ✅ Verifique se o nome do bucket está correto no `.env`
- ✅ Verifique se a região está correta

### Erro: "Bucket não encontrado"
- ✅ Verifique se o nome do bucket está correto (case-sensitive)
- ✅ Verifique se o bucket existe na região especificada

### Arquivo não aparece após upload
- ✅ Verifique os logs: `pm2 logs shared-songs`
- ✅ Verifique se o bucket está acessível no Console AWS
- ✅ Verifique se há erros de permissão

---

## 🔒 Segurança

### Boas Práticas:

1. **Nunca commite o `.env` no Git:**
   - ✅ Já está no `.gitignore`
   - ✅ Nunca compartilhe suas credenciais AWS

2. **Use políticas IAM restritivas:**
   - ✅ Dê apenas as permissões necessárias
   - ✅ Não use `AmazonS3FullAccess` em produção (foi só para teste)

3. **Rotacione credenciais periodicamente:**
   - ✅ Crie novas credenciais a cada 90 dias
   - ✅ Desative as antigas

4. **Use variáveis de ambiente:**
   - ✅ Nunca hardcode credenciais no código
   - ✅ Use `.env` ou gerenciadores de secrets (AWS Secrets Manager)

---

## 📊 Custos AWS S3

O S3 tem custos muito baixos para uso pessoal/pequeno:

- **Armazenamento:** ~$0.023 por GB/mês
- **Requests (PUT/GET):** ~$0.005 por 1.000 requests
- **Transferência de dados:** Primeiros 100 GB/mês são gratuitos

**Exemplo:** 10 GB de músicas + 10.000 uploads/mês = ~$0.30/mês

---

## ✅ Checklist Final

- [ ] Bucket S3 criado
- [ ] Usuário IAM criado
- [ ] Política IAM anexada ao usuário
- [ ] Credenciais salvas em local seguro
- [ ] `.env` atualizado com credenciais reais
- [ ] Aplicação reiniciada
- [ ] Upload testado e funcionando

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:

1. Verifique os logs: `pm2 logs shared-songs`
2. Verifique o Console AWS → S3 → Seu bucket → Ver se os arquivos estão sendo criados
3. Verifique o IAM → Users → Seu usuário → Permissions → Se as políticas estão anexadas
