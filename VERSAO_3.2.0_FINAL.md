# Ateliê Natália Huebra — V3.2.0 Final

Versão unificada para Hostinger.

- Site público servido em `/`
- Painel administrativo servido em `/admin`
- API e autenticação na mesma aplicação
- Conteúdo público alimentado pelo banco JSON da aplicação
- Banner desktop/mobile e mídias existentes integrados ao site principal
- Não inclui `.env` real nem banco de produção
- Startup: `server.js`
- Node.js: 20+

## Variáveis

Veja `.env.example`.

## Primeiro administrador

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` e inicie a aplicação. Em uma instalação nova, o administrador é criado automaticamente; em uma instalação já existente, use `npm run admin:create -- email senha`.

## Validação

`npm run check`

`npm run smoke`
