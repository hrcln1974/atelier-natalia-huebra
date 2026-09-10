# Atelier Natália Huebra — V13.2 Production

Plataforma Node.js/Express + SQLite com site público e painel administrativo em `/admin`.

## V13.2 — correção de produção
- Inicialização do administrador corrigida com `scripts/create-admin.js`.
- Banco SQLite e uploads não fazem parte do versionamento/ZIP de entrega.
- CRUD administrativo de vestidos, fotos, galeria, vídeos, categorias, coleções, leads e configurações.
- Upload com limite de tamanho e tipos permitidos; URL externa exige `http://` ou `https://`.
- Sessão JWT em cookie HttpOnly, logout e proteção das rotas administrativas.
- Painel responsivo para viewport mobile.
- Checks, build, smoke e production-gate preparados para validação local/Hostinger.

## Acesso administrativo
URL: `/admin`

Criar ou redefinir o administrador:
```bash
node scripts/create-admin.js admin@seudominio.com.br 'SUA-SENHA-FORTE'
```

O comando grava/atualiza somente o usuário informado com `role=admin`. Não coloque a senha no Git.

## Variáveis obrigatórias em `.env`
- `NODE_ENV=production`
- `PORT` — porta atribuída pela Hostinger
- `SITE_URL` — URL pública com HTTPS
- `DB_PATH` — caminho persistente do SQLite
- `MEDIA_ROOT` — caminho persistente das mídias
- `JWT_SECRET` — segredo longo e aleatório (mínimo recomendado: 32 caracteres)
- `WHATSAPP_NUMBER`
- `MAX_UPLOAD_MB`

`ADMIN_EMAIL`/`ADMIN_PASSWORD` são opcionais quando o administrador for criado pelo script. Valores reais ficam somente no `.env`/painel da Hostinger.

## Instalação local
```bash
npm ci
cp .env.example .env
node scripts/create-admin.js admin@seudominio.com.br 'SUA-SENHA-FORTE'
npm start
```

## Verificações
```bash
npm run check
npm run build
npm run smoke
npm run production-gate
```

`npm run smoke` exige que o servidor já esteja rodando na porta definida em `PORT`. `production-gate` cria banco/mídia temporários e executa smoke HTTP isolado.

## Hostinger
1. Criar a aplicação Node.js com Node 20+.
2. Subir o conteúdo do ZIP sem `node_modules`, `.env` e banco.
3. Configurar as variáveis do `.env` no painel da Hostinger.
4. Garantir que `DB_PATH` e `MEDIA_ROOT` apontem para áreas persistentes e graváveis.
5. Executar `npm ci` no servidor.
6. Criar o administrador: `node scripts/create-admin.js SEU-EMAIL 'SUA-SENHA'`.
7. Start: `npm start`. A porta deve ser a `PORT` fornecida/configurada pela aplicação Node da Hostinger; não fixe uma porta diferente.
8. Validar `/api/health`, `/admin`, login, CRUD, uploads, formulário, WhatsApp, HTTPS e mobile.

## Dados existentes
A base entregue continha 6 vestidos e 6 mídias, sem usuário administrador. Esses dados foram tratados como dados a preservar; a correção não apaga o conteúdo. A cópia do banco usada durante a correção fica apenas no backup local e não é incluída no ZIP.

## Fora do escopo desta V13.2
- Agente de IA / Atendimento automatizado
- Base de conhecimento da IA
- Histórico de conversas da IA
- Handoff IA → humano
- Configuração da IA no painel Admin
- Hardening avançado (CSRF robusto, expiração/renovação de sessão, auditoria de login)
