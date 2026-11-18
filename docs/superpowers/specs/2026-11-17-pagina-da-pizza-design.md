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
- Número do WhatsApp `5511999990000` (hoje repetido em vários lugares; manter coerente).

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
