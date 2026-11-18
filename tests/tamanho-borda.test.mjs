import { launch, check, summary, B, ROOT } from './lib.mjs';
const base={margherita:['Margherita',42],pepperoni:['Pepperoni',56],'quatro-queijos':['Quatro Queijos',54],cogumelos:['Cogumelos',52],vegetariana:['Vegetariana',46],'frango-barbecue':['Frango com Barbecue',50]};
const fmt=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
const cents=v=>Math.round(v*100)/100;
console.log('Task 4: tamanho e borda');
const b = await launch(375);
await b.open(B+'pizza.html?id=margherita');
const labels=(await b.ev('[...document.querySelectorAll("input[name=tamanho]")].map(i=>i.value+"|"+i.closest("label").innerText)')).map(x=>x.replace(/\s+/g,' ').trim());
check('3 tamanhos com preco: P 42,00 / M 54,60 / G 81,90', JSON.stringify(labels)===JSON.stringify(['P|P R$ 42,00','M|M R$ 54,60','G|G R$ 81,90']), JSON.stringify(labels));
check('2 opcoes de borda', JSON.stringify(await b.ev('[...document.querySelectorAll("input[name=borda]")].map(i=>i.value)'))===JSON.stringify(['sem','com']));
check('borda mostra +R$ 8,00', await b.ev('document.body.innerText.includes("+R$ 8,00")'));
check('padrao: P e sem borda marcados', (await b.ev('document.querySelector("input[name=tamanho]:checked")?.value'))==='P' && (await b.ev('document.querySelector("input[name=borda]:checked")?.value'))==='sem');
check('total inicial R$ 42,00', (await b.ev('document.getElementById("total")?.textContent'))==='R$ 42,00');
const msg=async()=>{await b.ev('limparSacola();document.querySelector(".btn-add").click()');return b.ev('mensagemPedido()')};
check('mensagem padrao', (await msg())==='Olá! Quero fazer este pedido:\n1x Margherita (P, sem borda) — R$ 42,00\nTotal: R$ 42,00', await msg());
await b.ev('document.querySelector("input[name=tamanho][value=M]").click();document.querySelector("input[name=borda][value=com]").click()');
check('M + com borda: total R$ 62,60', (await b.ev('document.getElementById("total").textContent'))==='R$ 62,60');
check('M + com borda: mensagem', (await msg())==='Olá! Quero fazer este pedido:\n1x Margherita (M, com borda) — R$ 62,60\nTotal: R$ 62,60', await msg());
check('alvos de toque >= 44px', await b.ev('[...document.querySelectorAll("input[name=tamanho],input[name=borda]")].every(i=>i.closest("label").getBoundingClientRect().height>=44)'));
check('sem rolagem horizontal 375', (await b.ev('document.documentElement.scrollWidth'))===375);
// todas as combinacoes, com cliques reais
let ok=0,tot=0,bad=[];
for (const [id,[nome,p]] of Object.entries(base)){
  await b.open(B+'pizza.html?id='+id);
  const preco={P:p,M:cents(p*1.3),G:cents(cents(p*1.3)*1.5)};
  for (const t of ['P','M','G']) for (const br of ['sem','com']){
    await b.ev(`document.querySelector("input[name=tamanho][value=${t}]").click();document.querySelector("input[name=borda][value=${br}]").click()`);
    const val=cents(preco[t]+(br==='com'?8:0));
    const esperado=`Olá! Quero fazer este pedido:\n1x ${nome} (${t}, ${br==='com'?'com':'sem'} borda) — ${fmt(val)}\nTotal: ${fmt(val)}`;
    const got=await msg(); const total=await b.ev('document.getElementById("total").textContent');
    tot++; if(got===esperado && total===fmt(val)) ok++; else bad.push([id,t,br,got,total]);
  }
}
check(`36 combinacoes (6 pizzas x 3 tamanhos x 2 bordas) corretas`, ok===tot, JSON.stringify(bad.slice(0,2)));
await b.setWidth(320); await b.open(B+'pizza.html?id=frango-barbecue');
check('sem rolagem horizontal 320', (await b.ev('document.documentElement.scrollWidth'))===320);
await b.open(B+'pizza.html?id=zzz');
check('id invalido: sem opcoes e sem erro', (await b.ev('document.querySelectorAll("input[name=tamanho]").length'))===0);
await b.close(); process.exit(summary()?1:0);
