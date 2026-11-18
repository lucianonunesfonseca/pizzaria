// Sacola de pedidos: guarda as linhas no navegador (localStorage), calcula o
// total e monta a mensagem do WhatsApp. Os preços não ficam guardados: são
// calculados na hora a partir de pizzas.js e bebidas.js, que toda página com
// este script precisa carregar antes (itens que saíram do cardápio são ignorados).
//
// Uma linha da sacola é:
//   pizza:               { tipo: "pizza", id, tamanho: "P"|"M"|"G", borda: bool, qtd }
//   bebida / sobremesa:  { tipo: "bebida"|"sobremesa", id, qtd }
// ---- Configuração do pedido (edite aqui) ----
var TAXA_ENTREGA = 7; // R$ somados ao total quando o cliente escolhe entrega; 0 = entrega grátis
var FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito"]; // "Dinheiro" mostra o campo de troco
var ENDERECO_RETIRADA = "Rua A, Jardim Florença, Itaberaí-GO"; // mostrado na retirada; "" para não mostrar
var LIMITES = { nome: 60, rua: 80, bairro: 40, complemento: 60, troco: 20, obs: 200 }; // tamanho máximo dos campos

var SACOLA_CHAVE = "bella-sacola";
var CHAVE_CLIENTE = "bella-cliente";
var QTD_MAX = 20;
var sacolaMemoria = []; // usada se o navegador não deixar guardar dados

function armazenamentoOk() {
  try {
    window.localStorage.setItem("bella-teste", "1");
    window.localStorage.removeItem("bella-teste");
    return true;
  } catch (e) {
    return false;
  }
}
var ARMAZENA = armazenamentoOk();

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

function linhaValida(l) {
  if (!l || typeof l !== "object") return false;
  if (l.tipo !== "pizza" && l.tipo !== "bebida" && l.tipo !== "sobremesa") return false;
  if (typeof l.id !== "string") return false;
  if (typeof l.qtd !== "number" || !isFinite(l.qtd) || l.qtd < 1) return false;
  if (l.tipo === "pizza") {
    if (TAMANHOS.indexOf(l.tamanho) === -1 || typeof l.borda !== "boolean") return false;
  }
  return true;
}

// false se o item saiu do cardápio (os dados precisam estar carregados na página).
function itemExiste(l) {
  if (l.tipo === "pizza") {
    var p = obterPizza(l.id);
    return !!p && typeof p.precos[l.tamanho] === "number";
  }
  var lista = l.tipo === "bebida" ? BEBIDAS : SOBREMESAS;
  return lista.some(function (i) { return i.id === l.id; });
}

function chaveLinha(l) {
  return l.tipo === "pizza"
    ? ["pizza", l.id, l.tamanho, l.borda ? "com" : "sem"].join("|")
    : [l.tipo, l.id].join("|");
}

function lerSacola() {
  var bruto;
  if (!ARMAZENA) {
    bruto = sacolaMemoria;
  } else {
    try {
      bruto = JSON.parse(window.localStorage.getItem(SACOLA_CHAVE) || "[]");
    } catch (e) {
      bruto = [];
    }
  }
  if (!Array.isArray(bruto)) return [];
  return bruto.filter(linhaValida).filter(itemExiste).map(function (l) {
    l.qtd = Math.min(Math.floor(l.qtd), QTD_MAX);
    return l;
  });
}

function salvarSacola(linhas) {
  if (ARMAZENA) {
    try {
      window.localStorage.setItem(SACOLA_CHAVE, JSON.stringify(linhas));
      return;
    } catch (e) {
      ARMAZENA = false;
    }
  }
  sacolaMemoria = linhas;
}

function adicionarASacola(novo) {
  var linhas = lerSacola();
  var linha = { tipo: novo.tipo, id: novo.id, qtd: 1 };
  if (novo.tipo === "pizza") {
    linha.tamanho = novo.tamanho;
    linha.borda = !!novo.borda;
  }
  var existente = linhas.filter(function (l) { return chaveLinha(l) === chaveLinha(linha); })[0];
  if (existente) {
    existente.qtd = Math.min(existente.qtd + 1, QTD_MAX);
  } else {
    linhas.push(linha);
  }
  salvarSacola(linhas);
  atualizarBotaoSacola();
}

function alterarQuantidade(chave, delta) {
  var linhas = lerSacola();
  linhas.forEach(function (l) {
    if (chaveLinha(l) === chave) l.qtd = Math.max(1, Math.min(l.qtd + delta, QTD_MAX));
  });
  salvarSacola(linhas);
  atualizarBotaoSacola();
}

function removerDaSacola(chave) {
  salvarSacola(lerSacola().filter(function (l) { return chaveLinha(l) !== chave; }));
  atualizarBotaoSacola();
}

function limparSacola() {
  salvarSacola([]);
  limparMarcaEnvio();
  atualizarBotaoSacola();
}

// Marca, só nesta aba, que o cliente tocou em "Enviar pedido". Quando ele volta do
// WhatsApp, a sacola.html pergunta se pode limpar a sacola.
var CHAVE_ENVIO = "bella-enviado";

function marcarPedidoEnviado() {
  try { window.sessionStorage.setItem(CHAVE_ENVIO, "1"); } catch (e) {}
}

function pedidoFoiEnviado() {
  try { return window.sessionStorage.getItem(CHAVE_ENVIO) === "1"; } catch (e) { return false; }
}

function limparMarcaEnvio() {
  try { window.sessionStorage.removeItem(CHAVE_ENVIO); } catch (e) {}
}

// Transforma uma linha em { chave, nome, detalhe, unit, qtd, subtotal };
// devolve null se o item não existe mais nos arquivos de dados.
function resolverLinha(l) {
  var nome, detalhe = "", unit;
  if (l.tipo === "pizza") {
    var p = typeof obterPizza === "function" ? obterPizza(l.id) : undefined;
    if (!p || typeof p.precos[l.tamanho] !== "number") return null;
    nome = p.nome;
    detalhe = l.tamanho + ", " + (l.borda ? "com" : "sem") + " borda";
    unit = precoPizza(p, l.tamanho, l.borda);
  } else {
    var lista = l.tipo === "bebida"
      ? (typeof BEBIDAS !== "undefined" ? BEBIDAS : [])
      : (typeof SOBREMESAS !== "undefined" ? SOBREMESAS : []);
    var item = lista.filter(function (i) { return i.id === l.id; })[0];
    if (!item) return null;
    nome = item.nome;
    unit = item.preco;
  }
  return {
    chave: chaveLinha(l),
    nome: nome,
    detalhe: detalhe,
    unit: unit,
    qtd: l.qtd,
    subtotal: arredondar(unit * l.qtd)
  };
}

function itensDaSacola() {
  return lerSacola().map(resolverLinha).filter(function (i) { return i !== null; });
}

function totalDaSacola() {
  return arredondar(itensDaSacola().reduce(function (soma, i) { return soma + i.subtotal; }, 0));
}

function contagemDaSacola() {
  return lerSacola().reduce(function (soma, l) { return soma + l.qtd; }, 0);
}

function linhasDosItens() {
  return itensDaSacola().map(function (i) {
    return i.qtd + "x " + i.nome + (i.detalhe ? " (" + i.detalhe + ")" : "") +
      " — " + formatarPreco(i.subtotal);
  });
}

// Só os itens e o total deles (sem os dados do cliente).
function mensagemPedido() {
  return "Olá! Quero fazer este pedido:\n" + linhasDosItens().join("\n") +
    "\nTotal: " + formatarPreco(totalDaSacola());
}

// "150" -> "R$ 150,00"; texto livre ("uma nota de 100") vai como escrito.
function formatarTroco(texto) {
  var n = Number(String(texto).replace(",", "."));
  return isFinite(n) && n > 0 ? formatarPreco(n) : texto;
}

// dados: { nome, tipo: "entrega"|"retirada", rua, bairro, complemento, pagamento, troco, obs }
function mensagemCompleta(d) {
  var subtotal = totalDaSacola();
  var entrega = d.tipo === "entrega";
  var taxa = entrega ? TAXA_ENTREGA : 0;
  var linhas = ["Olá! Quero fazer este pedido:"].concat(linhasDosItens());
  if (taxa > 0) {
    linhas.push("Subtotal: " + formatarPreco(subtotal));
    linhas.push("Taxa de entrega: " + formatarPreco(taxa));
  }
  linhas.push("Total: " + formatarPreco(arredondar(subtotal + taxa)));
  linhas.push("Nome: " + d.nome);
  if (entrega) {
    linhas.push("Entrega: " + d.rua + " - " + d.bairro + (d.complemento ? " (" + d.complemento + ")" : ""));
  } else {
    linhas.push("Retirada no balcão" + (ENDERECO_RETIRADA ? ": " + ENDERECO_RETIRADA : ""));
  }
  linhas.push("Pagamento: " + d.pagamento +
    (d.pagamento === "Dinheiro" && d.troco ? " (troco para " + formatarTroco(d.troco) + ")" : ""));
  if (d.obs) linhas.push("Obs: " + d.obs);
  return linhas.join("\n");
}

function linkPedidoSacola(dados) {
  return "https://wa.me/5562998452828?text=" + encodeURIComponent(mensagemCompleta(dados));
}

// Dados do cliente lembrados neste aparelho (só nome, entrega/retirada, endereço e pagamento).
function lerCliente() {
  if (!ARMAZENA) return null;
  var c;
  try {
    c = JSON.parse(window.localStorage.getItem(CHAVE_CLIENTE) || "null");
  } catch (e) {
    return null;
  }
  if (!c || typeof c !== "object" || Array.isArray(c)) return null;
  function texto(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }
  return {
    nome: texto(c.nome, LIMITES.nome),
    tipo: c.tipo === "entrega" || c.tipo === "retirada" ? c.tipo : "",
    rua: texto(c.rua, LIMITES.rua),
    bairro: texto(c.bairro, LIMITES.bairro),
    complemento: texto(c.complemento, LIMITES.complemento),
    pagamento: FORMAS_PAGAMENTO.indexOf(c.pagamento) !== -1 ? c.pagamento : ""
  };
}

function salvarCliente(d) {
  if (!ARMAZENA) return;
  try {
    window.localStorage.setItem(CHAVE_CLIENTE, JSON.stringify({
      nome: d.nome, tipo: d.tipo, rua: d.rua, bairro: d.bairro,
      complemento: d.complemento, pagamento: d.pagamento
    }));
  } catch (e) {}
}

function limparCliente() {
  try { window.localStorage.removeItem(CHAVE_CLIENTE); } catch (e) {}
}

// Botão flutuante com a contagem de itens (todas as páginas, menos a sacola).
function atualizarBotaoSacola() {
  var botao = document.querySelector(".sacola-fab");
  if (!botao) return;
  var n = contagemDaSacola();
  var selo = botao.querySelector(".sacola-badge");
  selo.textContent = n;
  selo.hidden = n === 0;
  botao.setAttribute("aria-label",
    n === 0 ? "Sacola, vazia" : "Sacola, " + n + (n === 1 ? " item" : " itens"));
}

function criarBotaoSacola() {
  if (/sacola\.html$/.test(location.pathname)) return;
  var botao = document.createElement("a");
  botao.className = "sacola-fab";
  botao.href = "sacola.html";
  botao.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>' +
    '<span class="sacola-badge" hidden></span>';
  document.body.appendChild(botao);
  atualizarBotaoSacola();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", criarBotaoSacola);
} else {
  criarBotaoSacola();
}
