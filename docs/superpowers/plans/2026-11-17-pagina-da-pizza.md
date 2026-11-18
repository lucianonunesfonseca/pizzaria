# Página da pizza com pedido pelo WhatsApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada pizza do cardápio leva a uma página própria (foto, ingredientes, acompanhamento) com botão para pedir aquela pizza pelo WhatsApp.

**Architecture:** `pizzas.js` guarda os dados e três funções auxiliares; `index.html` gera os cards a partir dele e `pizza.html?id=<id>` monta a página da pizza a partir dele. Sem frameworks, sem build.

**Tech Stack:** HTML, CSS e JavaScript puros (script comum, não módulo, para funcionar em `file://`).

**Spec:** `docs/superpowers/specs/2026-11-17-pagina-da-pizza-design.md`

## Global Constraints

- Idioma do site e das mensagens: pt-BR.
- Cores só pelos tokens de `:root` em `style.css` (`--bg #0f0f11`, `--accent #ff7a1a`); nunca valores soltos.
- WhatsApp: número `5562998452828`; mensagem do pedido `Olá! Quero pedir a pizza <nome> (R$ <preço>).`, aberta na **mesma aba** (`<a href>` sem `target`; nunca `window.open`).
- Nada do cardápio atual pode se perder: 6 pizzas com os mesmos nomes, ingredientes e preços.
- Sem rolagem horizontal a 375 px e 320 px; alvos de toque com no mínimo 44 px.
- Dados de usuário (parâmetro `id`) nunca entram como HTML: usar `textContent`.
- Regras do `CLAUDE.md`: explicar em 3 linhas o que foi feito, dizer como testar no navegador, um commit curto em português depois de cada mudança que funcionar.

## Review Focus

1. `pizza.html` sem `id` ou com `id` inexistente: aviso e link ao cardápio, sem erro de JavaScript.
2. `id` com HTML (`?id=<img src=x onerror=alert(1)>`): aparece como texto ou é ignorado, nunca executa.
3. Pizza sem `imagem` (todas, por enquanto): espaço reservado, sem imagem quebrada.
4. Acentos e caracteres especiais na mensagem (`Frango com Catupiry`, `Olá`, `R$`, parênteses): codificados corretamente no link.
5. JavaScript desligado: aviso com link direto ao WhatsApp, nas duas páginas.

---

### Task 1: Dados e página da pizza

**Files:**
- Create: `pizzas.js`
- Create: `pizza.html`
- Modify: `style.css` (blocos novos no fim, antes da media query `max-width: 420px`)

**Interfaces:**
- Produces (em `pizzas.js`, globais):
  - `PIZZAS: Array<{id: string, nome: string, preco: number, ingredientes: string[], imagem: string, acompanhamento: string}>`
  - `obterPizza(id: string): object | undefined`
  - `formatarPreco(valor: number): string` → `"R$ 42,00"`
  - `linkPedido(pizza: object): string` → URL `https://wa.me/5562998452828?text=...`

- [ ] **Step 1: Criar `pizzas.js`** com as 6 pizzas. `id` em minúsculas sem acento: `margherita`, `calabresa`, `quatro-queijos`, `portuguesa`, `frango-catupiry`, `pepperoni`. Preços 42, 46, 54, 52, 50, 56. Ingredientes quebrados do texto atual do `index.html` (ex.: Margherita = molho de tomate, mussarela, tomate fresco, manjericão). `imagem: ""` em todas. Um `acompanhamento` inventado por pizza (ex.: Suco de laranja natural, Guaraná, Vinho tinto, Suco de limão, Refrigerante de limão, Cerveja artesanal).
- [ ] **Step 2: Criar as três funções** no mesmo arquivo. `formatarPreco` usa `toLocaleString("pt-BR", {style:"currency", currency:"BRL"})`; atenção ao espaço não separável que o `toLocaleString` gera entre `R$` e o número: trocar por espaço comum para o texto bater com `R$ 42,00`. `linkPedido` usa `encodeURIComponent` na mensagem da Global Constraints.
- [ ] **Step 3: Criar `pizza.html`** com o mesmo `<head>`, `topbar` (Cardápio → `index.html#cardapio`, Sobre, Contato; nenhum `aria-current`) e rodapé das outras páginas. Corpo: `<main id="pizza">` vazio, `<noscript>` com aviso e link para `https://wa.me/5562998452828`, e um `<script>` que carrega `pizzas.js`, lê `new URLSearchParams(location.search).get("id")`, chama `obterPizza` e preenche: foto (`<img>` só se `imagem` não for vazio; senão `<figure class="photo-placeholder">` com ícone), `<h1>` nome, preço, `<ul>` de ingredientes, "Combina com: <acompanhamento>" e `<a class="btn btn-big" href=linkPedido(p)>Pedir esta pizza no WhatsApp</a>`. Atualiza `document.title` para `"<nome> — Bella Massa"`. Sem pizza: mensagem "Não encontramos essa pizza." e link "Ver o cardápio" para `index.html#cardapio`. Tudo via `textContent`/`createElement`.
- [ ] **Step 4: Estilos** em `style.css` reaproveitando `.photo-placeholder`, `.btn-big`, `.price`: classes novas só para o bloco do detalhe (nome/preço na mesma linha, lista de ingredientes com marcadores na cor de destaque, "Combina com" como linha secundária, link "← Cardápio" no topo).
- [ ] **Step 5: Verificar** abrindo `pizza.html?id=margherita` e `?id=pepperoni`. Esperado: título certo, ingredientes em lista, preço `R$ 42,00`, `href` do botão decodificado = `https://wa.me/5562998452828?text=Olá! Quero pedir a pizza Margherita (R$ 42,00).`. Cobrir Review Focus 1, 2 e 3: sem `id` → aviso; `?id=<img src=x onerror=alert(1)>` → nenhuma `<img>` criada pelo parâmetro e nenhum diálogo; `imagem` vazia → placeholder visível.
- [ ] **Step 6: Commit** `git add pizzas.js pizza.html style.css` → `git commit -m "página da pizza com pedido pelo WhatsApp"`.

### Task 2: Cardápio gerado e clicável

**Files:**
- Modify: `index.html` (seção `#cardapio`, os 6 `<article class="card">`)
- Modify: `style.css` (card clicável)

**Interfaces:**
- Consumes: `PIZZAS`, `formatarPreco` (Task 1).
- Produces: cada card é `<a class="card" href="pizza.html?id=<id>">` contendo nome, preço e uma linha de ingredientes (`ingredientes.join(", ")` + ponto final), com o mesmo visual de hoje.

- [ ] **Step 1: Substituir os 6 cards fixos** por `<div class="menu" id="menu"></div>` + `<noscript>` com aviso e link para `https://wa.me/5562998452828`; carregar `pizzas.js` antes do script inline e gerar os cards com `createElement`/`textContent`.
- [ ] **Step 2: Estilo do card como link:** `a.card` sem sublinhado, herdando cor, `display: block`, foco visível (`:focus-visible` com a cor de destaque), mesmo hover atual. Manter o script das reservas funcionando (não mexer nele).
- [ ] **Step 3: Verificar** em `index.html`: 6 cards, nomes e preços idênticos aos atuais (42,00 / 46,00 / 54,00 / 52,00 / 50,00 / 56,00), tocar em cada um leva a `pizza.html?id=<id>` com a pizza correta. Cobrir Review Focus 5 com JavaScript desativado: aviso aparece.
- [ ] **Step 4: Commit** `git add index.html style.css` → `git commit -m "cardápio gerado a partir da lista de pizzas"`.

### Task 3: Verificação completa e documentação

**Files:**
- Modify: `CLAUDE.md` (seção Estrutura e "Coisas que atravessam arquivos")

**Interfaces:**
- Consumes: tudo das Tasks 1 e 2.

- [ ] **Step 1: Verificar no Chrome simulando 375 px e 320 px** (script CDP já usado na sessão): sem rolagem horizontal em `index.html` e `pizza.html?id=<cada um dos 6>`; links da barra a 44 px; para cada pizza, o `href` do botão decodificado bate com `Olá! Quero pedir a pizza <nome> (R$ <preço>).` (cobre Review Focus 4, incluindo `Frango com Catupiry`); o botão não tem `target`; o formulário de reserva e o botão do rodapé do `index.html` continuam funcionando.
- [ ] **Step 2: Atualizar `CLAUDE.md`:** descrever `pizzas.js` (fonte única dos dados), `pizza.html?id=`, e que preços/ingredientes/acompanhamentos agora se editam em `pizzas.js`, não em `index.html`.
- [ ] **Step 3: Commit** `git add CLAUDE.md` → `git commit -m "documenta a página da pizza no CLAUDE.md"`.
