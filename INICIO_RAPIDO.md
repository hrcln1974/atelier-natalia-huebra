# ⚡ INÍCIO RÁPIDO - Ateliê Natália Huebra Premium

## 🎯 Seus Próximos 5 Passos

### 1️⃣ Teste o Site Localmente
```bash
# Abra o arquivo direto no navegador:
# Windows: Double-click em index.html
# Mac: Open index.html with → Chrome/Safari
# Linux: firefox index.html
```

**Resultado esperado:** 
- ✓ Banner luxuoso animado
- ✓ Galeria com fotos
- ✓ Botão WhatsApp flutuante
- ✓ Menu responsivo

---

### 2️⃣ Customize com Suas Fotos

#### A) Método Fácil (Canva - Recomendado)
```
1. Abra: https://www.canva.com
2. Crie um projeto 1080x1350px
3. Importe sua foto como background
4. Adicione marca-dagua.png no topo
5. Baixe como JPG
6. Coloque em assets/ (substitua os originas)
```

#### B) Método Automático (Python)
```bash
# Instale (primeira vez):
pip install pillow

# Use o script:
python watermark_tool.py assets/sua-foto.jpg
python watermark_tool.py assets/ --batch  # Toda pasta
```

---

### 3️⃣ Atualize Seus Contatos
**Localize no arquivo `index.html`:**

Procure por:
- `(28) 99983-5920` → SEU WHATSAPP
- `natytuany@hotmail.com` → SEU EMAIL
- `R. Salomão Fadlalah, 86` → SEU ENDEREÇO

**Substitua por suas informações!**

---

### 4️⃣ Coloque Online (Hospedagem Gratuita)

#### Opção 1: **NETLIFY** (Melhor para iniciantes)
```
1. Acesse: https://www.netlify.com
2. Login com GitHub/Google
3. Arraste a pasta "atelie-naty-huebra-premium" aqui
4. Pronto! Seu site está online em 10 segundos
```

#### Opção 2: **Vercel**
```
1. Acesse: https://vercel.com
2. Import projeto
3. Connect com GitHub
4. Deploy automático
```

#### Opção 3: **GitHub Pages** (Mais técnico)
```bash
git init
git add .
git commit -m "Site premium atelie"
git push origin main
# Ative Pages na config do GitHub
```

---

### 5️⃣ Teste em Mobile
```
✓ Abra em um celular (seu ou de amigo)
✓ Teste o menu mobile (☰)
✓ Teste o formulário de agendamento
✓ Teste o botão WhatsApp
✓ Verifique as imagens carregam rápido
```

---

## 🆕 Novidades Adicionadas

### 🛍️ Catálogo de Vestidos à Venda (`#catalogo`)
- Cards com foto, nome, descrição e **preço**.
- Botão "Comprar pelo WhatsApp" já monta a mensagem com o nome e preço do vestido.
- Para editar: procure `CATÁLOGO DE VESTIDOS À VENDA` no `index.html`, duplique um `.catalog-card` para adicionar mais vestidos e troque foto/nome/preço.

### 📸 Galeria com Filtro Noivas / Modelos (`#colecoes`)
- Botões "Todas / Noivas / Modelos" filtram as fotos automaticamente.
- Para classificar uma foto, use `data-category="noivas"` ou `data-category="modelos"` no `.gallery-item`.

### 🎬 Galeria de Vídeos (`#videos`)
- Os 3 vídeos locais ficam na pasta `videos/` e já estão configurados no `index.html`.
- Clique em qualquer card para abrir o player com controles e reprodução automática.
- Os arquivos usados são `video1.mp4`, `video2.mp4` e `video3.mp4`.
- As miniaturas são `video1-poster.jpg`, `video2-poster.jpg` e `video3-poster.jpg`.
- O código continua aceitando YouTube: se um card tiver `data-youtube` válido e não tiver `data-video`, ele abre o vídeo pelo YouTube.
- Para publicar na Hostinger, envie a pasta `videos/` junto com `index.html`, `script.js`, `style.css` e `assets/`.

### Trocar Cores Premium
No `index.html`, procure por `:root {` (~linha 25):

```css
/* Ouro/Champagne - Principais */
--champagne: #d7b579;     ← OURO CLARO
--gold: #b78b4d;          ← OURO ESCURO
--rose-gold: #c19a6b;     ← ROSE GOLD

/* Escuros */
--ink: #11100e;           ← PRETO LUXO
--ink-2: #1d1814;         ← PRETO+
--ink-3: #2a2622;         ← PRETO++

/* Claros */
--ivory: #fbf8f3;         ← BEGE CLARO
--cream: #f5efe7;         ← CREME
```

**Ferramentas para escolher cores:**
- https://colorhexa.com (Digite o código #)
- https://www.color-hex.com (Veja variações)

### Trocar Textos Principais
Procure por:
- `Seu Momento Perfeito` → Mude o título hero
- `Consultoria exclusiva...` → Mude descrição
- `Coleção Premium 2026` → Mude nome coleção

---

## 🚨 Cuidados Importantes

### ❌ NÃO FAÇA:
- Não delete `<script>` no final (funcionalidades)
- Não mude a estrutura HTML sem saber
- Não use imagens > 2MB (fica lento)
- Não altere links de contato sem teste

### ✅ FAÇA SEMPRE:
- Backup de `index.html` antes de editar
- Teste em mobile antes de publicar
- Use marca d'água em todas fotos
- Mantenha contatos atualizados

---

## 📞 Dúvidas Rápidas

**P: Mudei algo e quebrou?**
R: Restore do backup ou copie do GitHub.

**P: Imagem não aparece?**
R: Verifique se está em `assets/` e o nome exato.

**P: WhatsApp não funciona?**
R: Atualize o número no código.

**P: Como adiciono mais páginas?**
R: Crie `sobre.html`, `contato.html` etc e linque no menu.

**P: Como faço SEO/Google?**
R: Use Google Search Console depois de publicar.

---

## 🔗 Links Úteis

| Recurso | Link |
|---------|------|
| **Netlify** | https://netlify.com |
| **Canva** (marca d'água) | https://canva.com |
| **Tiny PNG** (compactar) | https://tinypng.com |
| **GitHub** (código) | https://github.com |
| **Vercel** (deploy) | https://vercel.com |
| **Google Analytics** | https://analytics.google.com |

---

## 📊 Checklist de Lançamento

- [ ] Todas as fotos com marca d'água
- [ ] Contatos e redes atualizados
- [ ] Site testado no browser
- [ ] Site testado no mobile
- [ ] WhatsApp funcionando
- [ ] Redes sociais linkadas
- [ ] Online e acessível
- [ ] Compartilhar com amigos

---

## 🎁 Próximos Passos Premium (Opcional)

### Básicos:
1. Google Analytics (medir visitantes)
2. Google Search Console (SEO)
3. Favicon customizado

### Intermediário:
1. Blog/Notícias
2. Portfolio expandido
3. Video no hero

### Avançado:
1. Sistema de agendamento
2. Integração email
3. Dark mode

---

## 💬 Precisa de Ajuda?

```
📧 Email: natytuany@hotmail.com
📱 WhatsApp: (28) 99983-5920
📌 Instagram: @nataliahuebra
👍 Facebook: fb.com/nataliahuebra
```

---

**Seu site é uma joia! Brilhe! ✨**

---

*Última atualização: Setembro 2026*  
*Status: ✅ Pronto para o Mundo*
