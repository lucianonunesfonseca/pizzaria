// Barra do topo, igual em todas as páginas: edite os links aqui.
// Cada página tem só <nav class="topbar" id="topbar"> (com o logo, que funciona mesmo sem
// JavaScript) e este script logo depois; ele completa a barra e marca a página atual.
(function () {
  var LINKS = [
    { texto: "Cardápio", href: "index.html#cardapio" },
    { texto: "Bebidas", href: "bebidas.html" },
    { texto: "Sobre", href: "sobre.html" },
    { texto: "Contato", href: "contato.html" }
  ];

  var barra = document.getElementById("topbar");
  if (!barra) return;
  var pagina = location.pathname.split("/").pop() || "index.html";

  var logo = document.createElement("a");
  logo.className = "brand";
  logo.href = "index.html";
  logo.appendChild(document.createTextNode("Bella "));
  var massa = document.createElement("span");
  massa.textContent = "Massa";
  logo.appendChild(massa);

  var links = document.createElement("div");
  links.className = "nav-links";
  LINKS.forEach(function (l) {
    var a = document.createElement("a");
    a.className = "nav-link";
    a.href = l.href;
    a.textContent = l.texto;
    // Só marca a página atual quando o link não aponta para um trecho (#) de outra página.
    if (l.href.indexOf("#") === -1 && l.href === pagina) a.setAttribute("aria-current", "page");
    links.appendChild(a);
  });

  barra.textContent = "";
  barra.appendChild(logo);
  barra.appendChild(links);
})();
