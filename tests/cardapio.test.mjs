import { launch, check, summary, B, ROOT } from './lib.mjs';
const b = await launch(375);
const PZ=[['margherita','Margherita','R$ 42,00'],['pepperoni','Pepperoni','R$ 56,00'],['quatro-queijos','Quatro Queijos','R$ 54,00'],['cogumelos','Cogumelos','R$ 52,00'],['vegetariana','Vegetariana','R$ 46,00'],['frango-barbecue','Frango com Barbecue','R$ 50,00']];
console.log('Task 2');
await b.open(B+'index.html');
check('6 cards sao links', (await b.ev('document.querySelectorAll("#menu a.card").length'))===6);
check('nao sobrou card fixo', (await b.ev('document.querySelectorAll("article.card").length'))===0);
for (const [id,nome,preco] of PZ){
  const t=await b.ev(`(()=>{const a=document.querySelector('#menu a.card[href="pizza.html?id=${id}"]');return a?{nome:a.querySelector('h3')?.textContent,preco:a.querySelector('.price')?.textContent,ing:a.querySelector('p')?.textContent}:null})()`);
  check('card '+id, t && t.nome===nome && t.preco==='a partir de '+preco && /\.$/.test(t.ing), JSON.stringify(t));
}
check('ingredientes do card em frase corrida (minusculas apos a 1a)', (await b.ev('document.querySelector("#menu a.card p").textContent'))==='Molho de tomate, mussarela e manjericão fresco.');
check('preco do card nao ultrapassa o card (375)', await b.ev('[...document.querySelectorAll("#menu a.card")].every(a=>{const r=a.getBoundingClientRect();return [...a.querySelectorAll("*")].every(e=>e.getBoundingClientRect().right<=r.right+0.5)})'));
check('cards com altura de toque >= 44', (await b.ev('(()=>{const c=[...document.querySelectorAll("#menu a.card")];return c.length===6&&c.every(a=>a.getBoundingClientRect().height>=44)})()')));
// toque real em cada card leva a pagina certa
for (const [id,nome] of PZ){
  await b.open(B+'index.html');
  await b.ev(`document.querySelector('#menu a.card[href="pizza.html?id=${id}"]').click()`); await b.wait(700);
  check('clique leva a '+id, (await b.ev('document.querySelector("h1")?.textContent'))===nome && (await b.ev('location.search'))==='?id='+id);
}
await b.open(B+'index.html');
check('sem rolagem horizontal 375', (await b.ev('document.documentElement.scrollWidth'))===375);
check('form de reserva ainda funciona', await b.ev(`(()=>{const f=document.getElementById('form-reserva');f.nome.value='Ana';f.telefone.value='11';f.pessoas.value='2';f.data.value='2030-01-02';return f.checkValidity()})()`));
check('botao WhatsApp do rodape intacto', (await b.ev('document.querySelectorAll("a.btn-big[href*=\\"wa.me\\"]").length'))===1);
await b.jsOff(true); await b.open(B+'index.html');
check('JS desligado: aviso com link wa.me', await b.ev('document.getElementById("cardapio").innerHTML.includes("wa.me/5562998452828")'));
await b.jsOff(false);
await b.setWidth(320); await b.open(B+'index.html');
check('preco do card nao ultrapassa o card (320)', await b.ev('[...document.querySelectorAll("#menu a.card")].every(a=>{const r=a.getBoundingClientRect();return [...a.querySelectorAll("*")].every(e=>e.getBoundingClientRect().right<=r.right+0.5)})'));
check('sem rolagem horizontal 320', (await b.ev('document.documentElement.scrollWidth'))===320);
await b.close(); process.exit(summary()?1:0);
