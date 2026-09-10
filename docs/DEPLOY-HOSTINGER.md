# Deploy Hostinger — V13.2

## Variáveis de ambiente
Configure no painel da aplicação Node.js (não no Git):
- `NODE_ENV=production`
- `PORT` = porta atribuída pela Hostinger
- `SITE_URL=https://SEU-DOMINIO`
- `DB_PATH=./data/atelier.db` ou caminho persistente equivalente
- `MEDIA_ROOT=./public/assets/uploads` ou caminho persistente equivalente
- `JWT_SECRET=` segredo longo e aleatório
- `WHATSAPP_NUMBER=` número em formato internacional, somente dígitos
- `MAX_UPLOAD_MB=50`

`ADMIN_EMAIL` e `ADMIN_PASSWORD` podem ser omitidos se o administrador for criado pelo script.

## Deploy
```bash
npm ci
node scripts/create-admin.js SEU-EMAIL 'SUA-SENHA-FORTE'
npm start
```

O start é `npm start`. A aplicação escuta a porta indicada por `PORT`; na Hostinger, use a porta fornecida pela configuração da aplicação, sem assumir 3000 em produção.

## Persistência
`data/*.db` e `public/assets/uploads/` não devem ser versionados. Faça backup do banco e da pasta de uploads antes de atualizações.

## Pós-deploy
- `GET /api/health` deve retornar HTTP 200.
- `/admin` deve abrir e aceitar o administrador criado.
- Sem cookie, `/api/admin/*` deve retornar 401.
- Validar CRUD, uploads, URL de imagem, foto principal, ordem, vídeos, categorias, coleções, leads, configurações e mobile.
- Validar HTTPS, headers, console, sitemap/robots e arquivos sensíveis.
