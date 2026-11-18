# Pizzaria Bella Massa — site
## O que é
Site de uma página em HTML, CSS e JavaScript puros. Sem frameworks, sem build.
Abrir: duplo clique em index.html.
## Regras 
- Responda sempre em português do Brasil.
- Antes de criar arquivos novos, explique o plano e espere meu OK.
- Mantenha o visual: fundo escuro (#0f0f11), destaque laranja (#ff7a1a).
- Depois de qualquer mudança, me diga como testar no navegador.
- Nunca apague conteúdo do cardápio sem eu pedir.
## Como eu aprendo
- Quando fizer algo novo, explique em 3 linhas o que fez e por quê.
## Git
- Depois de cada mudança que funcionar, faça um commit com mensagem curta em português.
## Estrutura
- Páginas: `index.html` (início, reserva), `pizza.html?id=<id>` (uma pizza), `sobre.html`, `contato.html`. Estilo único em `style.css`.
- `pizzas.js` é a **fonte única do cardápio** (nome, preços por tamanho `precos: {P, M, G}`, ingredientes, foto, acompanhamento). Preços, ingredientes, fotos e acompanhamentos se editam só ali: o cardápio do `index.html` e a `pizza.html` são gerados a partir dele. Cada preço de tamanho é um número editável (os valores iniciais foram M = P + 30% e G = M + 50%). O acréscimo da borda (R$ 8, igual para todas) é a constante `ACRESCIMO_BORDA`. O cardápio mostra só "a partir de" + o menor preço; a escolha de tamanho e borda fica na `pizza.html` e vai na mensagem do pedido. Foto: coloque o arquivo na pasta e escreva o nome em `imagem`.
- A barra do topo está repetida em cada página: ao criar ou renomear uma página, edite todas.
- O número do WhatsApp (`5511999990000`) está escrito em `pizzas.js`, `index.html`, `pizza.html` e `contato.html`. Mude em todos. Parece um número de teste.
- Os links e formulários do WhatsApp abrem na **mesma aba** (sem `target="_blank"` nem `window.open`): em nova aba falhou no iPhone.
- A barra do topo é fixa (~71 px no celular); os `scroll-margin-top` do CSS dependem dessa altura.
- Verificado a 375 px e 320 px, sem rolagem lateral e com alvos de toque de pelo menos 44 px.
