import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Task 6: sacola');
const b = await launch(375);
const wipe=async()=>{await b.open(B+'bebidas.html'); await b.ev('localStorage.clear()'); await b.open(B+'bebidas.html');};
await wipe();
const badge=()=>b.ev('(()=>{const e=document.querySelector(".sacola-badge");return e&&!e.hidden?e.textContent:"0"})()');
const fab=await b.ev('(()=>{const a=document.querySelector("a.sacola-fab");if(!a)return null;const r=a.getBoundingClientRect();return {h:a.getAttribute("href"),w:Math.round(r.width),ht:Math.round(r.height),label:a.getAttribute("aria-label")}})()');
check('botao flutuante da sacola, >=44px, aria-label', fab && fab.h==='sacola.html' && fab.w>=44 && fab.ht>=44 && /sacola/i.test(fab.label||''), JSON.stringify(fab));
check('sacola vazia: sem contagem', (await badge())==='0');
// adicionar na pagina de bebidas
const add=async(nome)=>b.ev(`[...document.querySelectorAll('.item')].find(i=>i.querySelector('h3').textContent==='${nome}').querySelector('.btn-add').click()`);
await add('Guaraná'); await add('Guaraná');
check('2x o mesmo item soma quantidade: 1 linha, contagem 2', (await b.ev('lerSacola().length'))===1 && (await badge())==='2');
await add('Suco de laranja natural');
check('item diferente: 2 linhas, contagem 3', (await b.ev('lerSacola().length'))===2 && (await badge())==='3');
check('feedback "Adicionado"', await b.ev('[...document.querySelectorAll(".item .btn-add")].some(x=>/adicionado/i.test(x.textContent))'));
// persiste entre paginas
await b.open(B+'index.html');
check('contagem persiste no index', (await badge())==='3');
// pizza
await b.open(B+'pizza.html?id=margherita');
const addPizza=()=>b.ev('document.querySelector(".btn-add").click()');
await b.ev('document.querySelector("input[name=tamanho][value=M]").click();document.querySelector("input[name=borda][value=com]").click()');
await addPizza(); await addPizza();
await b.ev('document.querySelector("input[name=tamanho][value=P]").click();document.querySelector("input[name=borda][value=sem]").click()');
await addPizza();
check('pizza: M+borda x2 e P x1 viram 2 linhas novas; contagem 6', (await b.ev('lerSacola().length'))===4 && (await badge())==='6', await b.ev('JSON.stringify(lerSacola())'));
check('pizza: sem botao wa.me direto', (await b.ev('document.querySelectorAll("a[href*=wa\\\\.me]").length'))===0);
check('pizza: feedback Adicionado (aria-live)', await b.ev('/adicionad/i.test(document.querySelector("[aria-live]")?.textContent||"")'));
// pagina da sacola
await b.open(B+'sacola.html');
const rows=await b.ev('[...document.querySelectorAll(".sacola-item")].map(r=>({n:r.querySelector(".sacola-nome")?.textContent,q:r.querySelector(".sacola-qtd")?.textContent,s:r.querySelector(".sacola-subtotal")?.textContent}))');
check('4 linhas com nome/qtd/subtotal', JSON.stringify(rows.map(r=>[r.n,r.q,r.s]))===JSON.stringify([['Guaraná','2','R$ 12,00'],['Suco de laranja natural','1','R$ 9,00'],['Margherita','2','R$ 125,20'],['Margherita','1','R$ 42,00']]), JSON.stringify(rows));
check('detalhe da pizza (M, com borda) e (P, sem borda)', await b.ev('document.body.innerText.includes("M, com borda") && document.body.innerText.includes("P, sem borda")'));
check('total R$ 188,20', (await b.ev('document.getElementById("sacola-total")?.textContent'))==='R$ 188,20');
const esperado='Olá! Quero fazer este pedido:\n2x Guaraná — R$ 12,00\n1x Suco de laranja natural — R$ 9,00\n2x Margherita (M, com borda) — R$ 125,20\n1x Margherita (P, sem borda) — R$ 42,00\nTotal: R$ 188,20';
const env=await b.ev('(()=>{const a=document.getElementById("enviar");return a?{h:decodeURIComponent(a.getAttribute("href")),t:a.hasAttribute("target")}:null})()');
check('botao Enviar: wa.me, mesma aba, mensagem completa', env && env.h==='https://wa.me/5562998452828?text='+esperado && env.t===false, JSON.stringify(env));
// quantidade
await b.ev('document.querySelectorAll(".sacola-item")[1].querySelector(".qtd-mais").click()');
check('+ aumenta qtd, subtotal e total', (await b.ev('document.querySelectorAll(".sacola-item")[1].querySelector(".sacola-qtd").textContent'))==='2' && (await b.ev('document.getElementById("sacola-total").textContent'))==='R$ 197,20');
check('botao flutuante oculto na sacola.html', (await b.ev('document.querySelector("a.sacola-fab")'))===null);
check('- no 1 esta desabilitado', await b.ev('document.querySelectorAll(".sacola-item")[3].querySelector(".qtd-menos").disabled'));
await b.ev('document.querySelectorAll(".sacola-item")[1].querySelector(".qtd-menos").click()');
check('- diminui', (await b.ev('document.querySelectorAll(".sacola-item")[1].querySelector(".sacola-qtd").textContent'))==='1' && (await b.ev('document.getElementById("sacola-total").textContent'))==='R$ 188,20');
check('alvos de toque >= 44px', await b.ev('[...document.querySelectorAll(".sacola-item button, #enviar")].every(e=>e.getBoundingClientRect().height>=44 && e.getBoundingClientRect().width>=44)'));
check('sem rolagem lateral 375', (await b.ev('document.documentElement.scrollWidth'))===375);
await b.setWidth(320); await b.open(B+'sacola.html');
check('sem rolagem lateral 320', (await b.ev('document.documentElement.scrollWidth'))===320);
await b.setWidth(375); await b.open(B+'sacola.html');
await b.ev('document.querySelectorAll(".sacola-item")[0].querySelector(".remover").click()');
check('remover tira a linha e atualiza o total', (await b.ev('document.querySelectorAll(".sacola-item").length'))===3 && (await b.ev('document.getElementById("sacola-total").textContent'))==='R$ 176,20');
while ((await b.ev('document.querySelectorAll(".sacola-item").length'))>0) await b.ev('document.querySelector(".sacola-item .remover").click()');
check('vazia: aviso, link ao cardapio, sem botao Enviar', (await b.ev('!!document.getElementById("sacola-vazia")')) && (await b.ev('!!document.querySelector("a.btn[href=\\"index.html#cardapio\\"]")')) && (await b.ev('document.getElementById("enviar")'))===null);
// limite de quantidade
await b.open(B+'bebidas.html');
await b.ev('localStorage.clear(); for(let i=0;i<25;i++) adicionarASacola({tipo:"bebida",id:"guarana"})');
check('qtd maxima 20', (await b.ev('lerSacola()[0].qtd'))===20);
// armazenamento corrompido / invalido
for (const [nome,val] of [['JSON quebrado','{oops'],['nao e lista','{"a":1}'],['itens invalidos descartados','[{"tipo":"pizza","id":"nao-existe","tamanho":"P","borda":false,"qtd":2},{"tipo":"bebida","id":"guarana","qtd":-5},{"tipo":"bebida","id":"guarana","qtd":"x"},null,7]']]){
  await b.open(B+'bebidas.html'); await b.ev(`localStorage.setItem('bella-sacola', ${JSON.stringify(val)})`);
  await b.open(B+'sacola.html');
  const r=await b.ev('({vazia:!!document.getElementById("sacola-vazia"),itens:document.querySelectorAll(".sacola-item").length})');
  check('armazenamento invalido: '+nome+' -> sacola vazia, sem erro', r.vazia && r.itens===0, JSON.stringify(r));
}
await b.open(B+'bebidas.html'); await b.ev(`localStorage.setItem('bella-sacola', '[{"tipo":"bebida","id":"guarana","qtd":999}]')`);
await b.open(B+'sacola.html');
check('qtd absurda limitada a 20', (await b.ev('document.querySelector(".sacola-qtd")?.textContent'))==='20');
// fab nao cobre o rodape
await b.open(B+'index.html'); await b.ev('window.scrollTo({top:99999,behavior:"instant"})'); await b.wait(300);
check('botao flutuante nao cobre o texto do rodape', await b.ev('(()=>{const f=document.querySelector("a.sacola-fab").getBoundingClientRect();const ft=document.querySelector("footer");const rg=document.createRange();rg.selectNodeContents(ft);const t=rg.getBoundingClientRect();return f.top>=t.bottom||f.right<=t.left||f.bottom<=t.top||f.left>=t.right})()'));
// sem armazenamento
await b.send('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("bloqueado")}})'});
await b.open(B+'bebidas.html');
const err=await b.ev('(()=>{try{[...document.querySelectorAll(".item .btn-add")][0].click();return "ok"}catch(e){return "ERR "+e.message}})()');
check('sem localStorage: adicionar nao quebra', err==='ok', err);
await b.open(B+'sacola.html');
check('sem localStorage: aviso na sacola', await b.ev('/não permite guardar/i.test(document.body.innerText)'));
// sem JS
await b.jsOff(true); await b.open(B+'sacola.html');
check('JS desligado: aviso com link wa.me', await b.ev('document.body.innerHTML.includes("wa.me/5562998452828")'));
await b.close(); process.exit(summary()?1:0);
