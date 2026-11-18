// Fonte única dos dados do cardápio. Edite preços, ingredientes, fotos e
// acompanhamentos aqui. Para usar uma foto, coloque o arquivo em images/ e
// escreva o caminho em "imagem" (ex.: "images/01-margherita.webp").
// "precos" são os valores de cada tamanho (P, M, G), editáveis um a um.
// O cardápio mostra "a partir de" + o menor desses valores.
// No cardápio os ingredientes viram frase corrida ("a, b e c") com minúscula depois do
// primeiro: evite nomes próprios nessa lista (na página da pizza ficam como escritos).
// "acompanhamento" deve ser o nome de um item de bebidas.js.
var ACRESCIMO_BORDA = 8; // R$ a mais em qualquer tamanho, com borda
var TAMANHOS = ["P", "M", "G"];
var PIZZAS = [
  {
    id: "margherita",
    nome: "Margherita",
    precos: { P: 42, M: 54.6, G: 81.9 },
    ingredientes: ["Molho de tomate", "Mussarela", "Manjericão fresco"],
    imagem: "images/01-margherita.webp",
    acompanhamento: "Suco de laranja natural"
  },
  {
    id: "pepperoni",
    nome: "Pepperoni",
    precos: { P: 56, M: 72.8, G: 109.2 },
    ingredientes: ["Molho de tomate", "Mussarela", "Pepperoni"],
    imagem: "images/02-pepperoni.webp",
    acompanhamento: "Cerveja artesanal"
  },
  {
    id: "quatro-queijos",
    nome: "Quatro Queijos",
    precos: { P: 54, M: 70.2, G: 105.3 },
    ingredientes: ["Mussarela", "Gorgonzola", "Ricota", "Parmesão"],
    imagem: "images/03-queijo-branco.webp",
    acompanhamento: "Vinho tinto suave"
  },
  {
    id: "cogumelos",
    nome: "Cogumelos",
    precos: { P: 52, M: 67.6, G: 101.4 },
    ingredientes: ["Molho de tomate", "Mussarela", "Cogumelos frescos"],
    imagem: "images/04-cogumelos.webp",
    acompanhamento: "Guaraná"
  },
  {
    id: "vegetariana",
    nome: "Vegetariana",
    precos: { P: 46, M: 59.8, G: 89.7 },
    ingredientes: ["Molho de tomate", "Mussarela", "Pimentão", "Cebola roxa", "Azeitonas pretas", "Tomate"],
    imagem: "images/05-vegetais.webp",
    acompanhamento: "Suco de limão com hortelã"
  },
  {
    id: "frango-barbecue",
    nome: "Frango com Barbecue",
    precos: { P: 50, M: 65, G: 97.5 },
    ingredientes: ["Mussarela", "Frango grelhado", "Cebola roxa", "Molho barbecue"],
    imagem: "images/06-frango.webp",
    acompanhamento: "Refrigerante de limão"
  }
];

// ["a", "b", "c"] -> "a, b e c"
function listaComE(itens) {
  if (itens.length <= 1) return itens.join("");
  return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
}

function obterPizza(id) {
  return PIZZAS.find(function (p) { return p.id === id; });
}

function formatarPreco(valor) {
  // toLocaleString usa espaço não separável entre "R$" e o número.
  return valor
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/ /g, " ");
}

function precoInicial(pizza) {
  return Math.min.apply(null, TAMANHOS.map(function (t) { return pizza.precos[t]; }));
}

function precoPizza(pizza, tamanho, comBorda) {
  var total = pizza.precos[tamanho] + (comBorda ? ACRESCIMO_BORDA : 0);
  return Math.round(total * 100) / 100;
}
