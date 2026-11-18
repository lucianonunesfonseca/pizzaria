// Fonte única dos dados do cardápio. Edite preços, ingredientes, fotos e
// acompanhamentos aqui. Para usar uma foto, coloque o arquivo na pasta do
// site e escreva o nome em "imagem" (ex.: "margherita.jpg").
// "precos" são os valores de cada tamanho (P, M, G), editáveis um a um.
// O cardápio mostra "a partir de" + o menor desses valores.
var ACRESCIMO_BORDA = 8; // R$ a mais em qualquer tamanho, com borda
var TAMANHOS = ["P", "M", "G"];
var PIZZAS = [
  {
    id: "margherita",
    nome: "Margherita",
    precos: { P: 42, M: 54.6, G: 81.9 },
    ingredientes: ["Molho de tomate", "Mussarela", "Tomate fresco", "Manjericão"],
    imagem: "",
    acompanhamento: "Suco de laranja natural"
  },
  {
    id: "calabresa",
    nome: "Calabresa",
    precos: { P: 46, M: 59.8, G: 89.7 },
    ingredientes: ["Mussarela", "Calabresa artesanal", "Cebola roxa", "Orégano"],
    imagem: "",
    acompanhamento: "Guaraná gelado"
  },
  {
    id: "quatro-queijos",
    nome: "Quatro Queijos",
    precos: { P: 54, M: 70.2, G: 105.3 },
    ingredientes: ["Mussarela", "Provolone", "Gorgonzola", "Parmesão"],
    imagem: "",
    acompanhamento: "Vinho tinto suave"
  },
  {
    id: "portuguesa",
    nome: "Portuguesa",
    precos: { P: 52, M: 67.6, G: 101.4 },
    ingredientes: ["Presunto", "Ovos", "Cebola", "Azeitonas", "Ervilha", "Mussarela"],
    imagem: "",
    acompanhamento: "Suco de limão com hortelã"
  },
  {
    id: "frango-catupiry",
    nome: "Frango com Catupiry",
    precos: { P: 50, M: 65, G: 97.5 },
    ingredientes: ["Frango desfiado temperado", "Catupiry cremoso", "Milho"],
    imagem: "",
    acompanhamento: "Refrigerante de limão"
  },
  {
    id: "pepperoni",
    nome: "Pepperoni",
    precos: { P: 56, M: 72.8, G: 109.2 },
    ingredientes: ["Mussarela", "Fatias generosas de pepperoni", "Mel picante"],
    imagem: "",
    acompanhamento: "Cerveja artesanal"
  }
];

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
