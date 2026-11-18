import { launch, check, summary, B, ROOT } from './lib.mjs';
const BEB=[['Suco de laranja natural','R$ 9,00'],['Suco de limão com hortelã','R$ 9,00'],['Guaraná','R$ 6,00'],['Refrigerante de limão','R$ 6,00'],['Cerveja artesanal','R$ 16,00'],['Vinho tinto suave','R$ 18,00']];
const SOB=[['Tiramisù','R$ 18,00'],['Pizza doce de chocolate','R$ 28,00'],['Petit gâteau com sorvete','R$ 22,00']];
console.log('Task 5: bebidas e sobremesas');
const b = await launch(375);
await b.open(B+'bebidas.html');
check('titulo da aba', (await b.ev('document.title'))==='Bebidas e Sobremesas — Bella Massa');
check('duas secoes com titulo', JSON.stringify(await b.ev('[...document.querySelectorAll("#bebidas h2,#sobremesas h2")].map(h=>h.textContent)'))===JSON.stringify(['Bebidas','Sobremesas']));
const items=async(sel)=>b.ev(`[...document.querySelectorAll('${sel} .item')].map(a=>({n:a.querySelector('h3')?.textContent,p:a.querySelector('.price')?.textContent,d:(a.querySelector('p')?.textContent||'').length,img:!!a.querySelector('.photo-placeholder,img.item-foto')}))`);
const bi=await items('#bebidas'), si=await items('#sobremesas');
check('6 bebidas: nome e preco', JSON.stringify(bi.map(i=>[i.n,i.p]))===JSON.stringify(BEB), JSON.stringify(bi.map(i=>[i.n,i.p])));
check('3 sobremesas: nome e preco', JSON.stringify(si.map(i=>[i.n,i.p]))===JSON.stringify(SOB), JSON.stringify(si.map(i=>[i.n,i.p])));
check('todos com descricao e imagem/espaco reservado', bi.length===6 && si.length===3 && [...bi,...si].every(i=>i.d>10 && i.img));
for (let k=0;k<9;k++){ await b.ev(`document.querySelectorAll('.item img').length>${k}&&document.querySelectorAll('.item img')[${k}].scrollIntoView({behavior:'instant',block:'center'})`); await b.wait(250); }
await b.wait(600);
check('sem img quebrada', (await b.ev('[...document.querySelectorAll("img")].every(i=>i.complete&&i.naturalWidth>0)')));
check('barra: Bebidas e a pagina atual', (await b.ev('document.querySelector("[aria-current=page]")?.textContent'))==='Bebidas');
const cta=await b.ev('(()=>{const a=document.querySelector("a.btn-big");return a?{h:a.getAttribute("href"),t:a.textContent}:null})()');
check('botao final: Ver minha sacola', cta && cta.h==='sacola.html' && cta.t==='Ver minha sacola', JSON.stringify(cta));
check('9 botoes Adicionar (>=44px)', await b.ev('(()=>{const x=[...document.querySelectorAll(".item .btn-add")];return x.length===9&&x.every(e=>e.getBoundingClientRect().height>=44)})()'));
// barra em todas as paginas
for (const p of ['index.html','sobre.html','contato.html','pizza.html?id=pepperoni','bebidas.html']){
  await b.open(B+p);
  const l=await b.ev('[...document.querySelectorAll(".nav-link")].map(a=>a.textContent+":"+a.getAttribute("href"))');
  check('barra '+p, JSON.stringify(l)===JSON.stringify(['Cardápio:index.html#cardapio'.replace('index.html#cardapio',p.startsWith('index')?'#cardapio':'index.html#cardapio'),'Bebidas:bebidas.html','Sobre:sobre.html','Contato:contato.html']), JSON.stringify(l));
}
// larguras e rolagem lateral
for (const w of [320,375,390,430,520,521,768,1024]){
  await b.setWidth(w);
  for (const p of ['bebidas.html','index.html','pizza.html?id=frango-barbecue']){
    await b.open(B+p);
    const r=await b.ev(`({sw:document.documentElement.scrollWidth,nav:[...document.querySelectorAll('.nav-link')].map(a=>Math.round(a.getBoundingClientRect().height)),links:[...document.querySelectorAll('.nav-link')].every(a=>a.getBoundingClientRect().right<=document.documentElement.clientWidth)})`);
    check(`${w}px ${p}: sem rolagem lateral, links dentro da tela, >=44px`, r.sw<=w && r.links && r.nav.every(h=>h>=44), JSON.stringify(r));
  }
}
// ancoras nao ficam escondidas atras da barra (celular)
await b.setWidth(375); await b.open(B+'index.html');
await b.ev('document.querySelector(".nav-link").click()'); await b.wait(1500);
check('Cardapio nao fica atras da barra', await b.ev('document.getElementById("cardapio").getBoundingClientRect().top>=document.querySelector(".topbar").getBoundingClientRect().bottom-1'));
// sem JS
await b.jsOff(true); await b.open(B+'bebidas.html');
check('JS desligado: aviso com link wa.me', await b.ev('document.body.innerHTML.includes("wa.me/5562998452828")'));
await b.jsOff(false);
await b.close(); process.exit(summary()?1:0);
