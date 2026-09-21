# Ateliê Natália Huebra — V5 Premium / Hostinger

## Requisitos
- Node.js 20+
- Startup file: `server.js`
- HTTPS ativo no domínio
- Armazenamento persistente para `data/` e `public/uploads/`

## Variáveis obrigatórias
Configure no painel da Hostinger e **não** coloque valores reais no GitHub:

```text
NODE_ENV=production
PORT=<porta da Hostinger, se exigida>
DB_PATH=./data/atelier-v5.json
ADMIN_EMAIL=seu-email-de-administrador
ADMIN_PASSWORD=uma-senha-forte-com-12-ou-mais-caracteres
MAX_UPLOAD_BYTES=52428800
```

Se o banco ainda não possuir usuário, o primeiro start cria o administrador usando `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

Para trocar a senha/administrador localmente:

```bash
node scripts/create-admin.js novo-email nova-senha-forte
```

## Acesso

```text
https://SEU-DOMINIO/admin
```

Agora `/admin` **não libera o painel diretamente**. A tela de login é obrigatória e a API também exige sessão válida.

## Segurança V5
- senha com `scrypt` + salt;
- sessão aleatória em cookie `HttpOnly`;
- `SameSite=Lax`;
- `Secure` em produção;
- expiração de sessão;
- rate limit para login;
- bloqueio após tentativas repetidas;
- proteção de origem em operações de escrita;
- headers de segurança;
- CSP;
- auditoria de login e alterações;
- validação de upload e limite de tamanho;
- API administrativa protegida no servidor.

## Catálogo
O site possui rotas separadas:

- `/venda` — catálogo de vestidos para venda;
- `/aluguel` — catálogo de vestidos para aluguel;
- `/vestidos` — curadoria geral;
- `/galeria` — galeria;
- `/videos` — vídeos;
- `/admin` — painel.

Cada vestido pode ser marcado como:

```text
sale    = venda
rental  = aluguel
both    = venda + aluguel
```

## Mídia
O painel permite cadastrar fotos e vídeos e, para fotos/vídeos enviados pelo administrador, salvar os arquivos em:

```text
public/uploads/media/
```

Faça backup dessa pasta juntamente com `data/`.

## Teste local obrigatório antes do deploy

```bash
npm install
npm run check
npm run smoke
```

O smoke test valida:
- site público;
- painel;
- acesso sem autenticação bloqueado;
- login correto/incorreto;
- sessão;
- logout;
- CRUD de cliente;
- CRUD de vestido;
- venda/aluguel;
- auditoria.

## Pós-deploy
1. `/health` deve responder `version: 5.0.0`.
2. `/admin` deve mostrar login.
3. Senha incorreta deve ser recusada.
4. Login correto deve abrir Dashboard.
5. `/api/clients` sem login deve responder `401`.
6. `/venda` e `/aluguel` devem abrir separadamente.
7. Fotos e vídeos devem carregar.
8. Upload deve funcionar e permanecer após reinício.
9. Backup de `data/` e `public/uploads/` deve estar configurado.
10. Testar HTTPS e domínio antes de considerar produção aprovada.
