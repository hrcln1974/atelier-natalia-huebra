# Atelier Natália Huebra — V13.2

## Correções
- Administrador criado/atualizável por script, sem senha real no código.
- Banco e uploads removidos do pacote de entrega/versionamento.
- CRUD de categorias e coleções com edição no painel.
- Validação de URL externa para mídia.
- Configuração de fundo escuro disponível no painel.
- Testes automatizados de autenticação, CRUD, mídia, upload inválido, configurações e responsividade estrutural.

## Dados
O banco original analisado continha 6 vestidos e 6 mídias e nenhum usuário. Os dados foram preservados durante a validação; o banco não é distribuído no ZIP final.

## Fora do escopo
- Agente de IA / Atendimento automatizado
- Base de conhecimento da IA
- Histórico de conversas da IA
- Handoff IA → humano
- Configuração da IA no painel Admin
- Hardening avançado (CSRF robusto, expiração/renovação de sessão, auditoria de login)

## Entrega
O ZIP V13.2 não contém `.env`, banco SQLite, `backups/`, `.git/` ou `node_modules/`.
