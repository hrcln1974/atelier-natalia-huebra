# Deploy Hostinger Cloud — V12

## Variáveis
- NODE_ENV=production
- PORT conforme a aplicação Node da Hostinger
- SITE_URL=https://SEU-DOMINIO
- DB_PATH caminho persistente do SQLite
- MEDIA_ROOT caminho persistente das mídias
- JWT_SECRET segredo longo e aleatório
- ADMIN_EMAIL e ADMIN_PASSWORD ou administrador criado por script
- WHATSAPP_NUMBER

## Pastas persistentes
Não versionar `data/*.db` nem `public/assets/uploads/`.

## Start
`npm start`

## Gate
Executar localmente e depois no servidor:
`npm run production-gate`

Depois:
`npm run smoke`

Validar no domínio real:
HTTPS, login, CRUD, upload, fotos, vídeos, formulário, WhatsApp, SEO, console, mobile, cache, headers, arquivos sensíveis e backup.
