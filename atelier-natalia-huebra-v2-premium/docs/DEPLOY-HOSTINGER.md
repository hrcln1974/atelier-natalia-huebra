# Deploy — Hostinger

1. Suba o projeto via GitHub ou Gerenciador de Arquivos.
2. Use Node.js 20+ (22 LTS quando disponível no plano).
3. Instale dependências com `npm ci`.
4. Configure as variáveis do `.env.example` no painel; nunca publique `.env` no GitHub.
5. Defina `PORT` conforme o runtime da Hostinger.
6. Defina `DB_PATH` para um local persistente. Em produção, confirme a política de persistência do plano para SQLite; se houver MySQL/MariaDB disponível e necessário, adapte o adaptador antes da migração.
7. Defina `MEDIA_ROOT` para um diretório persistente fora da pasta de deploy quando o plano permitir.
8. Start command: `npm start`.
9. Ative domínio, HTTPS e CDN/cache quando disponíveis.
10. Rode `npm run check`, `npm run build` e depois `npm run smoke` com o servidor ativo.
11. Crie o administrador com `node scripts/create-admin.js email senha` e remova/evite credenciais de teste.

## Produção
- Não exponha `/api/admin` sem autenticação.
- Não registre senhas, tokens ou chaves.
- Faça backup separado de banco, mídia e configuração.
- Valide uploads e permissões do diretório `MEDIA_ROOT`.
- Revise `npm audit --omit=dev` antes do lançamento.
