# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Landing page de uma única página: portfólio de um editor de vídeo do nicho **gaming**. Site estático (HTML + CSS + JS puro), sem build, sem `package.json`, sem testes, sem git.

**Converse com o usuário em português. Todo texto visível no site deve ser 100% em inglês.**

## Decisões do usuário (não reverter sem ele pedir)

- **Não inventar informações.** Nada de números/estatísticas, clientes, títulos ou durações de vídeos, categorias, ferramentas, bio, redes sociais, slogans. Onde faltar conteúdo, use placeholder óbvio (`Your Name`, `your@email.com`, `Write a short introduction about yourself here.`) e avise o usuário.
- **Não adicionar o que ele não pediu.** Estrutura pedida, nesta ordem: foto redonda + nome + descrição curta (máx. 2 linhas) → Long Form → Shorts → About Me (centralizado, sem foto) → Contact (e-mail grande + botão "Copy email", e abaixo as redes: X, Discord, YT Jobs).
- **Estética roxa e chapada:** fundo escuro liso, roxo como acento. Sem degradês coloridos, glows ou granulado.
- **Exatamente 3 long form e 3 shorts.** Long form um embaixo do outro (16:9); shorts lado a lado (9:16; no celular viram carrossel com swipe).
- O vídeo toca **na própria página** (lightbox); o visitante nunca sai do site.
- Animações "premium", mas o site deve continuar simples e com pouca informação.
- Já removidos a pedido dele: headline/hero principal, faixa marquee rolando, tela de carregamento, botão de showreel, foto grande no About, estatísticas, lista de ferramentas, relógio, granulado. (Redes sociais foram removidas antes, mas depois ele pediu de volta só no Contact.)
- Já preenchido com dados do usuário: nome **Yan Rodrigues**, e-mail `yanrodrigues.editor@gmail.com` (substituiu o antigo `yanfelipe678@gmail.com` a pedido dele), redes (X `https://x.com/yaneditorr`, Discord `@yaneditorr` — sem link público, o botão copia o usuário —, YT Jobs `https://ytjobs.co/talent/profile/662878`), foto e os 6 vídeos (YouTube; todos com embed liberado, conferido via oEmbed). Ainda provisórios: a descrição da intro ("Video editor for gaming content — long form & shorts.", escrita só com o que o usuário disse) e o texto do About Me (placeholder).

## Onde o conteúdo é editado

- `js/videos.js` — único lugar dos vídeos: `{ url, title, thumbnail }` em `longForm` e `shorts`. `url` vazio ⇒ card vazio e o player mostra "Coming soon"; `title` vazio ⇒ sem título.
- `index.html` — textos marcados com `<!-- EDITE -->`. O nome aparece em `<title>`, logo, intro (`h1`), `alt` da foto e rodapé; o e-mail em 3 lugares (texto, `mailto:`, `data-copy`). Redes em `ul.socials` no Contact (links abrem em nova aba; `[data-copy]` aceita `data-copy-msg` para o texto do toast).
- Foto: `assets/img/editor.jpg` (640×640, ~40 KB, JPEG qualidade 85), recortada em quadrado centrado no rosto a partir do original `Retrato profissional em fundo escuro.png` (raiz do projeto, 1086×1448, não é usado pelo site). Recorte feito com System.Drawing no PowerShell (HighQualityBicubic): quadrado de 860px, x = 113, y = 75 (cabelo perto do topo, gola da camiseta embaixo). Se o usuário trocar o original, refaça o recorte mantendo esse enquadramento. Se a foto não existir, o `onerror` remove o `<img>` e fica o ícone placeholder.
- Comentários voltados ao usuário ficam em português; comentários técnicos, em inglês.

## Arquitetura

Scripts (todos `defer`, nesta ordem): Lenis via CDN (`unpkg.com/lenis@1.1.13`) → `js/videos.js` → `js/player.js` → `js/main.js`.

- `videos.js` define `window.PORTFOLIO`.
- `player.js` expõe:
  - `window.VideoUtils.parse(url)` → `{ kind: 'iframe' | 'video', src, thumbs[] }` para YouTube/Shorts, Vimeo, Google Drive, TikTok, Instagram e `.mp4/.webm` (qualquer outra URL vira iframe direto);
  - `window.Player.open(list, index, isShort)` / `close()`: lightbox com anterior/próximo, Esc/setas e trap de foco. Fechar remove o iframe para parar o vídeo. Dispara `player:open` / `player:close` no `document`.
- `main.js` renderiza os cards a partir de `PORTFOLIO` e liga `[data-play]` ao `Player`. Thumbnails tentam em ordem: `thumbnail` → YouTube `maxresdefault` → `sddefault` → `hqdefault` (imagem de 120px de largura = tamanho inexistente no YouTube). Também cuida de: Lenis + trava de scroll (ouve os eventos do player e do menu mobile), header que some ao rolar para baixo, barra de progresso, link ativo do menu, reveals, bolha "Play" que segue o mouse (só mouse), botão magnético, copiar e-mail + toast.
- `css/base.css`: tokens em `:root`, reset, header, menu mobile, cursor, sistema de reveal. `css/sections.css`: intro, cards, shorts, about, contact, footer, player e responsivo (≤860px menu mobile, ≤720px layout de celular).
- Cores: `--accent #8b5cf6`, `--accent-strong #7c3aed` (fundos com texto branco), `--accent-soft #a78bfa` (texto roxo sobre escuro). Fontes (Google Fonts): Unbounded (títulos em caixa alta), Inter Tight (texto), JetBrains Mono (rótulos pequenos).

### Sistema de animação

- Script inline no `<head>` troca `no-js` por `js` no `<html>`; os estados "escondidos" das animações só existem sob `.js`.
- `main.js` adiciona `is-loaded` quando as fontes carregam (máx. 1,5s): o anel SVG da foto se desenha (`stroke-dashoffset`), depois foto, nome, descrição e header aparecem.
- 700ms depois começam os reveals por IntersectionObserver, que adicionam `.is-in` a: `[data-reveal="up" | "clip" | "card"]`, `[data-split]` (títulos quebrados em palavras pelo JS) e `[data-reveal-group]` (filhos em cascata via `--d`).
- `[data-roll]`: o JS envolve o texto para o efeito de rolar no hover.
- **Failsafe:** se `window.__siteReady` não for definido em 5s, o script inline remove a classe `js` e tudo aparece sem animação. Mantenha `window.__siteReady = true` como última linha do `main.js`.
- `prefers-reduced-motion` desliga o Lenis e as transições.

## Rodar e verificar

- Ver o site: abrir `index.html` no navegador. **Para testar vídeos do YouTube, use um servidor local** (ex.: extensão Live Server do VS Code): via `file://` o YouTube pode recusar o embed (erro 153, ele exige referrer).
- Checar sintaxe: `node --check js/main.js` (idem `js/player.js`, `js/videos.js`).
- Screenshots headless: `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --window-size=1440,900 --screenshot=<arquivo.png> <url>`. Cuidados:
  - As animações não terminam no modo headless. Para conferir o layout, gere uma cópia de teste no scratchpad com `<base href>` apontando para o projeto e CSS que force o estado final (`opacity:1; transform:none; clip-path:none` nos seletores de reveal e `stroke-dashoffset:0` no anel).
  - A janela headless tem largura mínima (~500px). Para mobile, carregue a página dentro de um `<iframe>` de 390px.
  - Para "rolar" até uma seção, desloque o `body` com `position:relative; top:-Npx`.
