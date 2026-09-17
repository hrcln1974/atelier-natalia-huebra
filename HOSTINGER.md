# Ateliê Natália Huebra — Deploy Hostinger

## 1. Requisitos
- Node.js 20+ (22 recomendado)
- Aplicação Node.js na Hostinger
- Diretório da aplicação apontando para a pasta do projeto
- Startup file: `server.js`

## 2. Variáveis de ambiente
Configure no painel da Hostinger:

```text
NODE_ENV=production
PORT=<porta fornecida pela Hostinger, se exigida>
DB_PATH=./data/db.json
ADMIN_EMAIL=seu-email-de-administrador
ADMIN_PASSWORD=uma-senha-forte-e-unica
```

Nunca coloque senha real no GitHub.

## 3. Instalação
Como a versão 3.0 usa somente módulos nativos do Node.js, não há dependências externas para instalar.

Se a Hostinger solicitar comandos:

```bash
npm install
npm start
```

## 4. Primeiro acesso ao painel
Abra:

```text
https://SEU-DOMINIO/admin
```

O primeiro `npm start` cria `data/db.json`. Se `ADMIN_PASSWORD` estiver definido, o administrador inicial é criado automaticamente.

Para trocar/criar o administrador:

```bash
npm run admin:create -- seu-email senha-forte
```

## 5. Persistência
O banco desta versão é um arquivo JSON em `data/db.json`, adequado para uma operação pequena/média em uma única instância Node. Inclua `data/` nos backups da Hostinger.

## 6. Estrutura pública
O site mantém o frontend existente e suas mídias:
- `assets/banner-natalia-huebra.png`
- `assets/banner-natalia-huebra-mobile.png`
- todas as fotografias existentes
- `videos/video1.mp4`
- `videos/video2.mp4`
- `videos/video3.mp4`

## 7. Rotas
- `/` — site público
- `/admin` — gestão
- `/health` — health check
- `/api/auth/*` — autenticação
- `/api/dashboard` — KPIs
- `/api/clients` — clientes
- `/api/leads` — CRM/leads
- `/api/appointments` — agenda
- `/api/products` — vestidos
- `/api/quotes` — orçamentos
- `/api/orders` — pedidos
- `/api/measurements` — medidas
- `/api/payments` — financeiro
- `/api/settings` — configurações
- `/api/audit` — auditoria

## 8. Checklist pós-deploy
- [ ] `https://SEU-DOMINIO/` abre com HTTP 200
- [ ] banner desktop aparece
- [ ] banner mobile aparece no celular
- [ ] fotos e vídeos carregam
- [ ] YouTube carrega
- [ ] WhatsApp abre
- [ ] Instagram abre
- [ ] Facebook abre
- [ ] formulário cria lead
- [ ] `/admin` abre
- [ ] login funciona
- [ ] dashboard funciona
- [ ] criação/edição/exclusão de registros funciona
- [ ] HTTPS ativo
- [ ] backup configurado


### Verificação pós-deploy da integração
1. Abra `/health` e confirme `version: 3.2.0`.
2. Acesse `/admin`, faça login e cadastre/edite um vestido em **Vestidos / Coleções**.
3. Cadastre uma foto em **Galeria** com `assets/nome-do-arquivo.jpg` e status `publicado`.
4. Cadastre um vídeo em **Vídeos** com `videos/video1.mp4` ou URL do YouTube e status `publicado`.
5. Abra o site público e confirme a atualização sem editar HTML.
6. Em **Configurações**, altere telefone/e-mail/redes e confirme no rodapé/contato.
