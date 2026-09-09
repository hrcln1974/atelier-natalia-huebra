# Atelier Natália Huebra — Site Premium

Site institucional e catálogo premium para o Atelier Natália Huebra, com foco em experiência, vestidos, sob encomenda, galeria, vídeos, WhatsApp e captação de leads.

## Stack
- HTML5, CSS3, JavaScript
- Node.js + Express
- SQLite (`sqlite3`) com camada simples de acesso
- JWT + bcryptjs para área administrativa
- Helmet, rate limit e Multer para segurança básica

## Estrutura
- `public/` frontend e assets
- `public/assets/images/` imagens fornecidas pelo Atelier, otimizadas em WebP quando aplicável
- `public/assets/videos/` vídeos fornecidos, convertidos para MP4 web
- `data/` banco local (ignorado pelo Git)
- `scripts/` preflight, build, smoke e criação de admin
- `docs/` deploy Hostinger

## Instalação
```bash
npm ci
copy .env.example .env
npm start
```
No Linux/macOS, copie com `cp .env.example .env`.

## Scripts
- `npm run check`
- `npm run build`
- `npm run smoke`
- `npm run production-check`
- `npm run audit`
- `npm run dev`

## Rotas principais
`/`, `/atelier`, `/vestidos`, `/vestidos/noivas`, `/vestidos/madrinhas`, `/vestidos/formandas`, `/vestidos/debutantes`, `/vestidos/festa`, `/vestidos/plus-size`, `/vestidos/sob-encomenda`, `/vestido/:slug`, `/catalogo`, `/colecoes`, `/galeria`, `/videos`, `/sob-encomenda`, `/experiencia`, `/depoimentos`, `/contato`, `/privacidade`, `/termos`, `/admin`.

## Regras comerciais
O catálogo não inventa preços, estoque, tamanhos, prazos, políticas, depoimentos ou certificações. Dados comerciais devem ser confirmados pelo Atelier.

## Conteúdo visual
Os arquivos entregues nos anexos foram usados como base visual. Não foram incluídas imagens de concorrentes.

## Segurança
Configure `JWT_SECRET` e credenciais administrativas fortes antes de produção. O `.env` é ignorado pelo Git. Revise CORS/CSP conforme a infraestrutura definitiva, mantenha HTTPS e execute auditoria de dependências.

## Observação de produção
O projeto está preparado para Hostinger, mas o ambiente real deve validar persistência de SQLite/mídia do plano contratado. Para crescimento maior, a camada de banco pode ser substituída por MySQL/MariaDB sem alterar a interface pública da aplicação.
