import fs from 'node:fs';
import { launch, check, summary, B, ROOT } from './lib.mjs';
const IDS=['margherita','pepperoni','quatro-queijos','cogumelos','vegetariana','frango-barbecue'];
const pages=['index.html','sobre.html','contato.html','bebidas.html',...IDS.map(i=>'pizza.html?id='+i)];
console.log('Task 3');
const b = await launch(375);
for (const w of [375,320]){
  await b.setWidth(w);
  for (const p of pages){
    await b.open(B+p);
    const r=await b.ev(`({sw:document.documentElement.scrollWidth,nav:[...document.querySelectorAll('.nav-link')].map(a=>Math.round(a.getBoundingClientRect().height)),topbar:Math.round(document.querySelector('.topbar').getBoundingClientRect().height)})`);
    check(`${w}px ${p}: sem rolagem lateral, 4 links de 44px, barra <= 100px`, r.sw===w && r.nav.length===4 && r.nav.every(h=>h>=44) && r.topbar<=100, JSON.stringify(r));
  }
}
// toque real com user agent de iPhone: card -> pizza -> botao navega na mesma aba
await b.send('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1'});
await b.send('Emulation.setTouchEmulationEnabled',{enabled:true});
await b.setWidth(390);
await b.open(B+'index.html');
const pos=await b.ev(`(()=>{const a=document.querySelector('#menu a.card[href$="frango-barbecue"]');a.scrollIntoView({behavior:'instant',block:'center'});const r=a.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
await b.wait(300);
const pos2=await b.ev(`(()=>{const r=document.querySelector('#menu a.card[href$="frango-barbecue"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pos2]}); await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await b.wait(900);
check('toque no card abre Frango com Barbecue', (await b.ev('document.querySelector("h1")?.textContent'))==='Frango com Barbecue');
await b.ev(`document.querySelector('.btn-big').scrollIntoView({behavior:'instant',block:'center'})`); await b.wait(300);
const p3=await b.ev(`(()=>{const r=document.querySelector('.btn-big').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===document.querySelector('.btn-big'),h:Math.round(r.height)}})()`);
check('botao de pedir visivel, sem nada por cima, grande', p3.hit && p3.h>=44, JSON.stringify(p3));
// documentacao
const md=fs.readFileSync(ROOT+'CLAUDE.md','utf8');
check('CLAUDE.md descreve pizzas.js e pizza.html', md.includes('pizzas.js') && md.includes('pizza.html'));
await b.close(); process.exit(summary()?1:0);
