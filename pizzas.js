// Fonte única dos dados do cardápio. Edite preços, ingredientes, fotos e
// acompanhamentos aqui. Para usar uma foto, coloque o arquivo na pasta do
// site e escreva o nome em "imagem" (ex.: "margherita.jpg").
var PIZZAS = [
  {
    id: "margherita",
    nome: "Margherita",
    preco: 42,
    ingredientes: ["Molho de tomate", "Mussarela", "Tomate fresco", "Manjericão"],
    imagem: "",
    acompanhamento: "Suco de laranja natural"
  },
  {
    id: "calabresa",
    nome: "Calabresa",
    preco: 46,
    ingredientes: ["Mussarela", "Calabresa artesanal", "Cebola roxa", "Orégano"],
    imagem: "",
    acompanhamento: "Guaraná gelado"
  },
  {
    id: "quatro-queijos",
    nome: "Quatro Queijos",
    preco: 54,
    ingredientes: ["Mussarela", "Provolone", "Gorgonzola", "Parmesão"],
    imagem: "",
    acompanhamento: "Vinho tinto suave"
  },
  {
    id: "portuguesa",
    nome: "Portuguesa",
    preco: 52,
    ingredientes: ["Presunto", "Ovos", "Cebola", "Azeitonas", "Ervilha", "Mussarela"],
    imagem: "",
    acompanhamento: "Suco de limão com hortelã"
  },
  {
    id: "frango-catupiry",
    nome: "Frango com Catupiry",
    preco: 50,
    ingredientes: ["Frango desfiado temperado", "Catupiry cremoso", "Milho"],
    imagem: "",
    acompanhamento: "Refrigerante de limão"
  },
  {
    id: "pepperoni",
    nome: "Pepperoni",
    preco: 56,
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

function linkPedido(pizza) {
  var mensagem = "Olá! Quero pedir a pizza " + pizza.nome + " (" + formatarPreco(pizza.preco) + ").";
  return "https://wa.me/5511999990000?text=" + encodeURIComponent(mensagem);
}
