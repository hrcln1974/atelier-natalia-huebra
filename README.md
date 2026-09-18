# Atelier Natália Huebra — V4 Premium

Plataforma premium para atelier de moda com:
- site público responsivo;
- catálogo de vestidos;
- catálogo separado para VENDA e ALUGUEL;
- preços de venda e aluguel;
- controle de status e reservas;
- dashboard administrativo;
- clientes, leads e agenda;
- configurações;
- fotos e vídeos preservados do projeto original;
- estrutura pronta para Hostinger.

## Execução

```bash
npm install
npm run check
npm run smoke
npm start
```

O banco local é criado em `data/atelier-v4.json`. Para produção, defina `DB_PATH`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Nunca versionar banco ou segredos.

## Rotas
- `/` site público
- `/admin` painel
- `/api/public` catálogo público
- `/health` health check

## Modelo comercial
Cada vestido aceita `venda`, `aluguel` ou `venda_aluguel`, com preço próprio para cada modalidade.
