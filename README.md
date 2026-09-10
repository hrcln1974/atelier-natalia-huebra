# Atelier Natália Huebra — V12 Integrada

Plataforma premium de **Noivas • Festa • Alta-Costura • Sob Encomenda**, com site público + painel administrativo/CMS.

## O que há nesta V12
- Home editorial clara, com marfim/champagne/dourado e fotografia.
- Catálogo dinâmico vindo da API/banco.
- Página individual de vestido.
- CMS para vestidos, categorias, coleções, fotos, galeria, foto principal, ordem, vídeos, links e leads.
- Login administrativo real com bcrypt + JWT em cookie HttpOnly.
- Upload de imagens e vídeos para armazenamento persistente.
- SEO básico, robots e sitemap.
- Helmet, rate limiting, validações e proteção de origem para mutações administrativas.
- Scripts de check, build, smoke e production-gate.

## Instalação
```bash
npm install
cp .env.example .env
# preencha ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET e SITE_URL
npm start
```

## Criar/atualizar administrador
```bash
node scripts/create-admin.js admin@seudominio.com.br 'SUA-SENHA-FORTE'
```

## Testes
```bash
npm run check
npm run build
npm start
npm run smoke
npm run audit
npm run production-gate
```

## Hostinger
1. Criar aplicação Node.js com Node 20+.
2. Configurar `SITE_URL`, `PORT`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`/hash e `MEDIA_ROOT`.
3. Manter `data/` e `public/assets/uploads/` persistentes e fora do Git.
4. Ativar HTTPS/SSL no domínio.
5. Configurar domínio e CDN/cache somente depois de validar a aplicação.
6. Executar Production Gate no ambiente real.

## CMS
Acesse `/admin`.

Fluxo principal:
**Login → Vestidos → Novo/Editar → Categoria → Dados → Fotos → Foto principal → Ordem → Vídeo/links → Publicar**.

A publicação usa a mesma API/banco do site público, portanto não é necessário editar HTML/JS para inserir peças.
