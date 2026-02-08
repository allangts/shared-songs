# 🔧 Troubleshooting Nginx - Domínio indo para aplicação errada

## Problema

Quando você acessa `sharedsongs.essentialcode.com.br`, está indo para outra aplicação ao invés da aplicação correta.

## Causas Comuns

1. **Server block padrão** capturando todos os domínios
2. **`server_name _`** (catch-all) em outro site
3. **`default_server`** em outro site
4. **Ordem de leitura** dos arquivos no Nginx

---

## 🔍 Diagnóstico Rápido

Execute na VM:

```bash
# 1. Ver quais sites estão habilitados
ls -la /etc/nginx/sites-enabled/

# 2. Ver qual configuração está sendo usada
sudo nginx -T | grep -A 10 "server_name"

# 3. Verificar se há default_server
sudo grep -r "default_server" /etc/nginx/sites-enabled/

# 4. Verificar se há server_name _
sudo grep -r "server_name _" /etc/nginx/sites-enabled/

# 5. Ver qual aplicação está na porta 3000
sudo lsof -i :3000
# ou
sudo netstat -tlnp | grep 3000
```

---

## ✅ Solução Automática

Execute o script de correção:

```bash
chmod +x fix-nginx-domain.sh
./fix-nginx-domain.sh
```

---

## 🔧 Solução Manual

### Passo 1: Verificar configurações existentes

```bash
# Listar todos os sites habilitados
ls -la /etc/nginx/sites-enabled/

# Ver conteúdo de cada um
sudo cat /etc/nginx/sites-enabled/nome-do-arquivo
```

### Passo 2: Identificar o problema

Procure por estas configurações problemáticas:

#### ❌ Problema 1: `default_server`

```nginx
server {
    listen 80 default_server;  # ← Isso captura todos os domínios!
    server_name outro-dominio.com;
    ...
}
```

**Solução:** Remova `default_server`:

```nginx
server {
    listen 80;  # ← Sem default_server
    server_name outro-dominio.com;
    ...
}
```

#### ❌ Problema 2: `server_name _`

```nginx
server {
    listen 80;
    server_name _;  # ← Isso captura todos os domínios!
    ...
}
```

**Solução:** Especifique um domínio ou remova:

```nginx
server {
    listen 80;
    server_name outro-dominio.com;  # ← Domínio específico
    ...
}
```

#### ❌ Problema 3: Sem `server_name`

```nginx
server {
    listen 80;
    # ← Sem server_name = captura todos os domínios!
    ...
}
```

**Solução:** Adicione um `server_name` específico.

---

### Passo 3: Criar/Atualizar configuração do shared-songs

```bash
sudo nano /etc/nginx/sites-available/shared-songs
```

Certifique-se de que está assim:

```nginx
server {
    listen 80;
    server_name sharedsongs.essentialcode.com.br;  # ← Domínio específico!

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;  # ← Porta da sua aplicação
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

### Passo 4: Habilitar o site

```bash
# Criar link simbólico
sudo ln -sf /etc/nginx/sites-available/shared-songs /etc/nginx/sites-enabled/

# Verificar se foi criado
ls -la /etc/nginx/sites-enabled/shared-songs
```

### Passo 5: Remover `default_server` de outros sites

Para cada arquivo em `/etc/nginx/sites-enabled/` (exceto `shared-songs`):

```bash
# Editar o arquivo
sudo nano /etc/nginx/sites-enabled/nome-do-outro-site

# Procurar por "default_server" e remover
# De: listen 80 default_server;
# Para: listen 80;
```

Ou use sed:

```bash
sudo sed -i 's/ listen 80 default_server;/ listen 80;/g' /etc/nginx/sites-enabled/nome-do-outro-site
sudo sed -i 's/ listen \[::\]:80 default_server;/ listen [::]:80;/g' /etc/nginx/sites-enabled/nome-do-outro-site
```

### Passo 6: Testar e reiniciar

```bash
# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx

# Ou reiniciar
sudo systemctl restart nginx
```

---

## 🧪 Testar se está funcionando

### Teste 1: Via curl (na VM)

```bash
# Testar com o header Host correto
curl -H "Host: sharedsongs.essentialcode.com.br" http://localhost

# Deve retornar HTML da aplicação shared-songs
```

### Teste 2: Verificar logs

```bash
# Ver logs de acesso em tempo real
sudo tail -f /var/log/nginx/access.log

# Acesse o domínio no navegador e veja se aparece nos logs
```

### Teste 3: Verificar qual aplicação está na porta 3000

```bash
# Ver qual processo está usando a porta 3000
sudo lsof -i :3000

# Ou
sudo netstat -tlnp | grep 3000

# Se não for a aplicação correta, pare e inicie a correta:
pm2 stop all
pm2 start npm --name "shared-songs" -- start
```

---

## 📋 Checklist Final

- [ ] Configuração `shared-songs` criada em `/etc/nginx/sites-available/`
- [ ] Link simbólico criado em `/etc/nginx/sites-enabled/`
- [ ] `server_name sharedsongs.essentialcode.com.br` está correto
- [ ] `proxy_pass http://localhost:3000` aponta para a porta correta
- [ ] Removido `default_server` de outros sites
- [ ] Removido `server_name _` de outros sites
- [ ] `nginx -t` passou sem erros
- [ ] Nginx reiniciado/reload
- [ ] Aplicação rodando na porta 3000
- [ ] Teste via curl funcionando

---

## 🆘 Se ainda não funcionar

1. **Verificar DNS:**
   ```bash
   dig sharedsongs.essentialcode.com.br
   # Deve retornar o IP da VM
   ```

2. **Verificar firewall:**
   ```bash
   sudo ufw status
   # Portas 80 e 443 devem estar abertas
   ```

3. **Ver logs de erro:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Verificar se há múltiplas instâncias do Nginx:**
   ```bash
   ps aux | grep nginx
   ```

5. **Verificar configuração completa:**
   ```bash
   sudo nginx -T | grep -A 30 "server_name sharedsongs"
   ```

---

## 💡 Dica: Múltiplos Domínios na Mesma VM

Se você tem múltiplos domínios na mesma VM, cada um deve ter seu próprio `server_name`:

```nginx
# /etc/nginx/sites-available/app1
server {
    listen 80;
    server_name app1.essentialcode.com.br;
    location / {
        proxy_pass http://localhost:3001;
    }
}

# /etc/nginx/sites-available/shared-songs
server {
    listen 80;
    server_name sharedsongs.essentialcode.com.br;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

**Nenhum deles deve ter `default_server` ou `server_name _`!**
