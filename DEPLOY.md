# 🚀 Guia de Deploy - sharedsongs.essentialcode.com.br

## Passo 1: Verificar DNS

Certifique-se de que o DNS está apontando corretamente:

```bash
# Verificar se o DNS está propagado
dig sharedsongs.essentialcode.com.br

# Ou usar nslookup
nslookup sharedsongs.essentialcode.com.br
```

O resultado deve mostrar o IP: `3.138.174.99`

---

## Passo 2: Configurar Nginx

### Opção A: Usar o script automatizado

```bash
chmod +x nginx-config.sh
./nginx-config.sh
```

### Opção B: Configuração manual

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx -y

# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/shared-songs
```

Cole o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name sharedsongs.essentialcode.com.br;

    # Tamanho máximo de upload (50MB para arquivos de áudio)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para uploads grandes
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/shared-songs /etc/nginx/sites-enabled/

# Remover site padrão (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## Passo 3: Garantir que a aplicação está rodando

```bash
# Verificar se está rodando na porta 3000
pm2 list

# Se não estiver rodando, iniciar:
pm2 start npm --name "shared-songs" -- start

# Ou manualmente:
npm run start
```

---

## Passo 4: Configurar SSL/HTTPS (Obrigatório)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d sharedsongs.essentialcode.com.br

# Seguir as instruções interativas
# - Email: seu email
# - Aceitar termos: Y
# - Compartilhar email: N (ou Y)
# - Redirecionar HTTP para HTTPS: 2 (recomendado)
```

O Certbot vai:
- ✅ Obter o certificado SSL
- ✅ Configurar HTTPS automaticamente
- ✅ Renovar automaticamente (via cron)

---

## Passo 5: Verificar se está funcionando

1. **Teste HTTP (deve redirecionar para HTTPS):**
   ```
   http://sharedsongs.essentialcode.com.br
   ```

2. **Teste HTTPS:**
   ```
   https://sharedsongs.essentialcode.com.br
   ```

3. **Verificar certificado SSL:**
   ```bash
   curl -I https://sharedsongs.essentialcode.com.br
   ```

---

## Passo 6: Configurar variável de ambiente (se necessário)

Se você quiser forçar HTTPS nos cookies mesmo sem NODE_ENV=production, adicione no `.env`:

```env
NODE_ENV=production
```

Ou ajuste o código para verificar se está rodando via HTTPS.

---

## Troubleshooting

### Erro 502 Bad Gateway
- Verifique se a aplicação está rodando: `pm2 list`
- Verifique os logs: `pm2 logs shared-songs`
- Verifique se a porta 3000 está correta

### DNS não resolve
- Aguarde a propagação (pode levar até 48h, geralmente é rápido)
- Verifique o DNS: `dig sharedsongs.essentialcode.com.br`

### Certificado SSL não funciona
- Verifique se o DNS está apontando corretamente
- Verifique se a porta 80 está aberta no firewall
- Verifique logs: `sudo tail -f /var/log/nginx/error.log`

### Cookies não funcionam
- Verifique se está usando HTTPS
- Verifique se `NODE_ENV=production` está no `.env`
- Verifique o console do navegador (F12) → Application → Cookies

---

## Comandos úteis

```bash
# Ver status do Nginx
sudo systemctl status nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status da aplicação
pm2 status
pm2 logs shared-songs

# Reiniciar aplicação
pm2 restart shared-songs

# Ver certificados SSL
sudo certbot certificates

# Renovar certificado manualmente
sudo certbot renew
```

---

## Firewall (se necessário)

Se estiver usando UFW:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

Se estiver usando AWS Security Groups, certifique-se de que as portas 80 e 443 estão abertas.
