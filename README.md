# Ateliê Natália Huebra — Plataforma Premium v3.0

Site público sofisticado + plataforma de gestão administrativa, mantendo a identidade visual e as fotografias/mídias originais do projeto.

## Incluído
- Site público responsivo
- Banner desktop + banner mobile específico
- Galeria e lightbox
- Catálogo
- Vídeos locais
- YouTube responsivo
- WhatsApp
- Instagram
- Facebook
- Formulário com persistência de leads
- Login administrativo
- Dashboard
- Clientes
- Leads/CRM
- Agenda
- Vestidos/coleções
- Orçamentos
- Pedidos
- Ficha de medidas
- Financeiro
- Configurações
- Auditoria
- Headers de segurança
- Rate limit de login
- Sessão HttpOnly/SameSite
- Estrutura preparada para Hostinger

## Testes locais
```bash
npm run check
npm run smoke
npm start
```

Acesse `http://localhost:3000/` e `http://localhost:3000/admin`.

## Administração
Defina `ADMIN_PASSWORD` no ambiente ou use:
```bash
npm run admin:create -- email senha-forte
```

## Deploy
Consulte `HOSTINGER.md`.


## Integração pública real — v3.1.0
O site público consome `/api/public` sem autenticação. Catálogo/vestidos, galeria, vídeos e configurações são persistidos no banco JSON e refletidos automaticamente no frontend. O painel permite criar, editar e excluir esses registros.

### Fluxo validado
`Painel → API autenticada → banco → API pública → site`
