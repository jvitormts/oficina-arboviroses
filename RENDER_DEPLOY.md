# Deploy no Render — Alertas de Arboviroses

Este guia mostra como publicar o sistema no [Render](https://dashboard.render.com/) usando PostgreSQL.

## Pré-requisitos

- Repositório no GitHub com este código.
- Conta no Render.

---

## 1. Criar o banco PostgreSQL

1. No painel do Render, clique em **New** → **PostgreSQL**.
2. Defina um nome (ex.: `oficina-arboviroses-db`).
3. Escolha o plano desejado. **Atenção:** o Render não oferece mais PostgreSQL gratuito — há um período de teste e depois o plano passa a ser pago.
4. Clique em **Create Database**.
5. Na página do banco, copie a **External Database URL** (a URL `postgres://...`).

---

## 2. Criar o Web Service

Há duas formas: **Blueprint** (automática) ou **manual**.

### Opção A — Blueprint (com `render.yaml`)

1. No Render, clique em **New** → **Blueprint**.
2. Conecte o repositório do GitHub.
3. O Render lê o arquivo `render.yaml` e cria o serviço automaticamente.

### Opção B — Manual (dashboard)

1. Clique em **New** → **Web Service**.
2. Conecte o repositório do GitHub.
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free (web service)
4. Em **Environment Variables**, adicione as variáveis da seção abaixo.

---

## 3. Variáveis de ambiente

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | A URL `postgres://...` do banco criado no passo 1 |
| `JWT_SECRET` | Gere com `openssl rand -hex 32` |
| `VAPID_PUBLIC_KEY` | `BLVFR-fVqmL4yoTELLoNC8FyYzdCrncAg9wSLDpaMGzXy1LiogPrQHpgxgYdYyPSnhns_hDZKh9EVq4TCV152sA` |
| `VAPID_PRIVATE_KEY` | `-Tl-QvQo9NCivOAGWuk18OyUCAjwOXjrKyCmlEZIxyE` |
| `ADMIN_PASSWORD` | (opcional) Senha inicial do admin. Padrão: `admin123` |

O `DATABASE_URL` pode ser tanto a URL **externa** (com `?sslmode=require`) quanto a **interna**. O sistema já trata SSL quando `sslmode=require` está presente.

---

## 4. Deploy

1. Faça push do código para o repositório conectado.
2. O Render roda o build (`pnpm build`) e, na inicialização, o próprio servidor aplica as migrações automaticamente (cria as tabelas no PostgreSQL).
3. Acesse a URL fornecida pelo Render.

---

## Notas

- As tabelas são criadas automaticamente na inicialização do servidor (migrações em `drizzle/migrations`).
- O web service Free é suspenso após ~15 min sem tráfego; a primeira requisição após isso pode demorar alguns segundos.
- As contas (admin e usuários) são criadas/verificadas automaticamente na inicialização do servidor.
