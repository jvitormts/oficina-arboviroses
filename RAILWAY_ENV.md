# Variáveis de Ambiente — Railway

## Service Principal (App)

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `${{MySQL.DATABASE_URL}}` |
| `JWT_SECRET` | (gere com `openssl rand -hex 32`) |
| `VAPID_PUBLIC_KEY` | `BLVFR-fVqmL4yoTELLoNC8FyYzdCrncAg9wSLDpaMGzXy1LiogPrQHpgxgYdYyPSnhns_hDZKh9EVq4TCV152sA` |
| `VAPID_PRIVATE_KEY` | `-Tl-QvQo9NCivOAGWuk18OyUCAjwOXjrKyCmlEZIxyE` |

## Service MySQL

O Railway cria automaticamente as variáveis `MYSQL_URL`, `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`. Não precisa adicionar nada manualmente.

## Após adicionar as variáveis

1. Clique em **Deploy** no Railway
2. Aguarde ficar **Success**
3. Abra o site, logue, clique em **"Ativar"**
4. Console (F12 → Console) para ver logs `[Push]`

## Troubleshooting

| Log no Console | Causa | Solução |
|----------------|-------|---------|
| `[Push] VAPID public key is empty` | `VAPID_PUBLIC_KEY` não configurada | Adicione a variável e redeploy |
| `[Push] Service worker registration failed` | SW não registrado | Verifique se `sw.js` está acessível em `/sw.js` |
| `[Push] Notification permission: denied` | Permissão negada | Limpe dados do site e tente novamente |
| `[Push] subscribeToPush failed: ...` | Erro geral | Veja o erro completo no console |
| `Falha ao ativar notificações` | `subscribeToPush` retornou false | Veja os logs `[Push]` anteriores |
