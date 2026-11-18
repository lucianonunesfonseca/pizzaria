# Página da pizza com pedido pelo WhatsApp — design

## Intenção
Cada pizza do cardápio vira um item clicável que leva a uma página própria (foto, ingredientes em lista, sugestão de acompanhamento). O objetivo é o cliente **pedir aquela pizza direto pelo WhatsApp**, com a mensagem já escrita.

## Objetivos
- Página por pizza com link compartilhável (`pizza.html?id=<id>`).
- Botão "Pedir esta pizza no WhatsApp" com mensagem: "Olá! Quero pedir a pizza <nome> (R$ <preço>)."
- Dados de cada pizza em um único lugar (`pizzas.js`), usados pelo cardápio e pela página.

## Não objetivos
Carrinho com várias pizzas e pagamento. (Tamanhos e borda entraram depois, ver atualização no fim.) Cada pedido é de uma pizza; o resto se combina no WhatsApp.

## Anti-objetivos
- Perder conteúdo do cardápio (nomes, ingredientes e preços atuais ficam idênticos).
- Repetir o problema do iPhone: o pedido navega na mesma aba (sem `target="_blank"` / `window.open`).

## Restrições
- HTML, CSS e JavaScript puros, sem frameworks nem build.
- Abre por duplo clique (`file://`): `pizzas.js` é script comum (variável global `PIZZAS`), não módulo ES.
- Mesmo visual (tokens em `:root` do `style.css`), mobile 375 px e 320 px sem rolagem lateral, alvos de toque >= 44 px.
- Número do WhatsApp `5562998452828` (hoje repetido em vários lugares; manter coerente).

## Abordagens consideradas
- **A. Um HTML por pizza:** simples e sem JS, mas repete barra e número em 9 arquivos.
- **B. Página-modelo + lista central (escolhida):** um lugar para editar; 1 página nova; link por pizza; custo: depende de JS.
- **C. Painel sobre o cardápio:** sem link por pizza, "voltar" do celular fecha a página; não é "uma página".
Escolha do usuário: **B**.

## Design
- `pizzas.js`: `PIZZAS = [{ id, nome, preco, ingredientes: [..], imagem, acompanhamento }]` com as 6 pizzas atuais. `imagem` vazio/ausente -> espaço reservado com ícone.
- `pizza.html`: barra do topo (Cardápio, Sobre, Contato; nenhuma como página atual), foto, nome, preço, lista de ingredientes, "Combina com", botão de pedido. Título da aba = nome da pizza. `id` inexistente -> aviso + link ao cardápio. `<noscript>` com aviso e link direto ao WhatsApp.
- `index.html`: cards do cardápio gerados de `PIZZAS`, cada um leva a `pizza.html?id=<id>`; `<noscript>` com aviso.
- `style.css`: estilos da página da pizza e do card clicável.

## Escolhas minhas (a revisar)
- Acompanhamentos inventados, um por pizza (suco, refrigerante, sobremesa).
- Fotos: espaço reservado até o usuário fornecer imagens (colocar o arquivo na pasta e indicar em `pizzas.js`).
- Ingredientes viram lista a partir do texto atual.

## Fica para quem constrói
Nomes das classes CSS, detalhes visuais do card clicável, textos exatos dos avisos, ícone do espaço reservado.

## Atualização: tamanho e borda (2026-11-17)
- Cada pizza tem `precos: { P, M, G }` escritos e editáveis um a um (valores iniciais: M = P + 30%, G = M + 50%, arredondados a centavos). Borda: `ACRESCIMO_BORDA = 8` (R$, igual para todas e todos os tamanhos).
- Cardápio (`index.html`): cada card mostra só "a partir de R$ <menor preço>".
- `pizza.html`: escolha de tamanho (P/M/G, com o preço de cada um) e de borda (sem / com, "+R$ 8,00") por botões de rádio estilizados (alvo >= 44 px, teclado ok); padrão P e sem borda; "Total" e o botão atualizam na hora.
- Mensagem: "Olá! Quero pedir a pizza <nome>, tamanho <T>, <com|sem> borda (R$ <total>)."
- Escolhido por mim: botões de rádio em vez de menu suspenso (toque no celular).

## Atualização: sacola (2026-11-17)
- Todo pedido passa pela sacola; o botão "Pedir esta pizza no WhatsApp" saiu. `pizza.html` tem "Adicionar à sacola" (com tamanho e borda); `bebidas.html` tem "Adicionar" em cada item (e o botão final virou "Ver minha sacola"). Os botões "Pedir no WhatsApp" do `index.html` ficam como contato geral.
- `sacola.js`: guarda linhas no `localStorage` (`bella-sacola`) sem preços; mesmo item soma a quantidade (1 a 20); linhas inválidas são descartadas; sem `localStorage` usa memória e a `sacola.html` avisa. Botão flutuante com contagem em todas as páginas (menos na sacola).
- `sacola.html`: lista, quantidade (− e +), remover, total e "Enviar pedido pelo WhatsApp". Mensagem: "Olá! Quero fazer este pedido:" + uma linha por item ("2x Margherita (M, com borda) — R$ 125,20") + "Total: R$ ...".
- Fora do escopo: nome, endereço, entrega/retirada (combinados na conversa do WhatsApp).

## Atualização: fotos e cardápio (2026-11-17)
- As 15 fotos fornecidas (PNG transparente, ~28 MB) viraram WebP com transparência em `images/` (<= 900 px, ~50-165 KB cada, ~1,8 MB no total); os PNGs ficam em `imagens-originais/` (ignorada pelo Git).
- A caixa da foto (página da pizza e cards de bebidas) passou de 16:9 com corte (`cover`) para quadrada com a imagem inteira (`contain`); na página da pizza tem no máximo 520 px. A foto da equipe em `sobre.html` continua 16:9.
- Cardápio ajustado às fotos, na ordem delas: Margherita, Pepperoni, Quatro Queijos, Cogumelos, Vegetariana e Frango com Barbecue. Os ingredientes descrevem o que aparece em cada foto; os preços ficaram nos mesmos valores das posições antigas (editáveis). Acompanhamentos devem ser nomes de itens de `bebidas.js`.

## Atualização: favicon e limpeza da sacola (2026-11-18)
- Favicon: `favicon.svg` (fatia de pizza laranja sobre fundo escuro), `favicon-32.png` e `apple-touch-icon.png` (180 px, sem cantos arredondados, o iOS arredonda sozinho), ligados no `<head>` das 6 páginas.
- Depois de enviar o pedido a sacola não esvazia sozinha (se o WhatsApp não abrir o cliente perderia tudo). Ao tocar em "Enviar", a `sacola.html` marca o envio na aba (`sessionStorage`); ao voltar (carregar a página, `pageshow` ou `visibilitychange`), pergunta "Você enviou o pedido pelo WhatsApp?" com "Sim, limpar a sacola" / "Não, manter os itens". Existe também o botão "Limpar sacola". Sacola vazia apaga a marca; `sessionStorage` bloqueado não quebra nada.
