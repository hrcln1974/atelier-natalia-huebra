# Atelier Natália Huebra — V2 Premium

Plataforma premium do Atelier Natália Huebra com catálogo público, leads/CRM, painel administrativo, CMS básico, segurança, SEO e trilha de auditoria.

## V2 — produção

- Node.js + Express
- SQLite com migração automática das colunas adicionadas na V2
- Autenticação administrativa por usuário do banco + bcrypt + JWT
- Cookie HttpOnly / SameSite para sessão
- Rate limit global e reforço no login
- Helmet e proteção de origem para mutações administrativas
- Dashboard com KPIs e leads recentes
- Gestão de vestidos: criar, editar, excluir, status, destaque e SEO
- Gestão de leads: status CRM e exclusão
- Gestão de depoimentos reais/autorizados
- Configurações públicas do Atelier
- Upload seguro de imagens WEBP/JPG/PNG e MP4 até 8 MB
- Auditoria de ações administrativas
- Catálogo público preservado
- WhatsApp e formulário de atendimento
- SEO, robots.txt e sitemap

## Instalação local

```bash
npm install
cp .env.example .env
```

No Windows/Git Bash, preencha `.env` com um `JWT_SECRET` forte e os dados do administrador.

Depois:

```bash
node scripts/create-admin.js seu-email@dominio.com.br "SuaSenhaForte"
npm run check
npm start
```

Acesse `/admin` para o painel.

## Variáveis obrigatórias

```env
NODE_ENV=production
PORT=3000
DB_PATH=./data/atelier.db
MEDIA_ROOT=./public/assets/uploads
JWT_SECRET=segredo-aleatorio-com-32-ou-mais-caracteres
ADMIN_EMAIL=admin@dominio.com.br
ADMIN_PASSWORD=senha-apenas-para-automacao
```

`ADMIN_EMAIL` e `ADMIN_PASSWORD` são mantidos como compatibilidade/automação. O login da V2 autentica contra a tabela `users`; use `scripts/create-admin.js` para criar ou atualizar o administrador.

## Testes antes da entrega

```bash
npm run check
npm run build
npm run audit
```

Com o servidor em execução:

```bash
npm run smoke
```

## Hostinger

1. Configure Node.js na aplicação.
2. Defina as variáveis do `.env` no ambiente da aplicação.
3. Garanta que `data/` e `public/assets/uploads/` tenham permissão de escrita.
4. Execute `npm install` no servidor.
5. Execute `node scripts/create-admin.js` uma vez para criar/atualizar o administrador.
6. Inicie com `npm start` conforme o gerenciador Node da Hostinger.
7. Valide `/api/health`, `/`, `/vestidos`, `/contato` e `/admin`.

> Nunca publique o arquivo `.env` nem use a senha de exemplo em produção.
