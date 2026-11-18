// Dados do negócio: edite aqui. Valem para o site inteiro.
// (Os avisos "ative o JavaScript" de index, pizza, bebidas e sacola repetem o número em texto
// fixo, porque o JavaScript não roda neles; um teste confere que continuam iguais a este.)
var WHATSAPP_NUMERO = "5562998452828"; // 55 (Brasil) + DDD + número, só dígitos
var TELEFONE_EXIBIDO = "(62) 99845-2828"; // como aparece escrito no site

var TAXA_ENTREGA = 7; // R$ somados ao total quando o cliente escolhe entrega; 0 = entrega grátis
var FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito"]; // "Dinheiro" mostra o campo de troco
var ENDERECO_RETIRADA = "Rua A, Jardim Florença, Itaberaí-GO"; // mostrado na retirada; "" para não mostrar

// Link do WhatsApp para o número do negócio, com mensagem opcional.
function linkWhatsApp(mensagem) {
  return "https://wa.me/" + WHATSAPP_NUMERO + (mensagem ? "?text=" + encodeURIComponent(mensagem) : "");
}

// <a data-whatsapp="mensagem"> recebe o link; qualquer [data-telefone] recebe o telefone escrito.
function preencherDadosDoNegocio() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-whatsapp]"), function (a) {
    a.href = linkWhatsApp(a.getAttribute("data-whatsapp"));
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-telefone]"), function (e) {
    e.textContent = TELEFONE_EXIBIDO;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", preencherDadosDoNegocio);
} else {
  preencherDadosDoNegocio();
}
