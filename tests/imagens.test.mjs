import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Task 8: imagens e cardapio das fotos');
const dir=ROOT+'images/';
const files=fs.readdirSync(dir);

// arquivos
check('images/ so tem .webp (15)', files.length===15 && files.every(f=>f.endsWith('.webp')), files.join(','));
check('cada imagem <= 200 KB', files.every(f=>fs.statSync(dir+f).size<=200*1024), files.map(f=>f+':'+Math.round(fs.statSync(dir+f).size/1024)).join(' '));
check('total <= 3 MB', files.reduce((s,f)=>s+fs.statSync(dir+f).size,0)<=3*1024*1024);
const alpha=f=>{const d=fs.readFileSync(dir+f); return d.slice(0,4).toString()==='RIFF'&&d.slice(8,12).toString()==='WEBP'&&d.slice(12,16).toString()==='VP8X'&&(d[20]&0x10)!==0;};
check('WebP com transparencia (todas)', files.length===15 && files.every(alpha), files.filter(f=>!alpha(f)).join(','));
check('originais fora do Git (imagens-originais ignorada)', execSync('git check-ignore imagens-originais/x.png || echo NAO',{cwd:ROOT}).toString().includes('imagens-originais'));

const b = await launch(375);
// pizzas: foto quadrada, inteira, sem corte
const ids=['margherita','pepperoni','quatro-queijos','cogumelos','vegetariana','frango-barbecue'];
for (const id of ids){
  await b.open(B+'pizza.html?id='+id); await b.wait(400);
  const r=await b.ev(`(()=>{const i=document.querySelector("main img.pizza-foto");if(!i)return null;const r=i.getBoundingClientRect();return {ok:i.complete&&i.naturalWidth>0,w:Math.round(r.width),h:Math.round(r.height),fit:getComputedStyle(i).objectFit,src:i.getAttribute("src"),nw:i.naturalWidth}})()`);
  check('pizza '+id+': imagem .webp carregada, quadrada, contain', r && r.ok && r.src.endsWith('.webp') && Math.abs(r.w-r.h)<=1 && r.fit==='contain' && r.nw<=1000, JSON.stringify(r));
}
check('pizza: sem rolagem lateral 375', (await b.ev('document.documentElement.scrollWidth'))===375);
await b.setWidth(1024); await b.open(B+'pizza.html?id=margherita'); await b.wait(400);
const big=await b.ev('(()=>{const r=document.querySelector("main img.pizza-foto").getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)}})()');
check('desktop: foto da pizza <= 520px e quadrada', big.w<=520 && Math.abs(big.w-big.h)<=1, JSON.stringify(big));
await b.setWidth(375);
// bebidas
await b.open(B+'bebidas.html'); await b.wait(600);
for (let k=0;k<9;k++){ await b.ev(`document.querySelectorAll(".item img")[${k}].scrollIntoView({behavior:"instant",block:"center"})`); await b.wait(250); }
await b.wait(600);
const it=await b.ev(`[...document.querySelectorAll(".item img.item-foto")].map(i=>{const r=i.getBoundingClientRect();return {ok:i.complete&&i.naturalWidth>0,sq:Math.abs(r.width-r.height)<=1,fit:getComputedStyle(i).objectFit,lazy:i.loading,webp:i.getAttribute("src").endsWith(".webp")}})`);
check('9 imagens de bebidas/sobremesas: carregadas, quadradas, contain, lazy, webp', it.length===9 && it.every(x=>x.ok&&x.sq&&x.fit==='contain'&&x.lazy==='lazy'&&x.webp), JSON.stringify(it.filter(x=>!(x.ok&&x.sq&&x.fit==='contain'&&x.lazy==='lazy'&&x.webp))));
check('bebidas: sem rolagem lateral 375', (await b.ev('document.documentElement.scrollWidth'))===375);
await b.setWidth(320); await b.open(B+'bebidas.html');
check('bebidas: sem rolagem lateral 320', (await b.ev('document.documentElement.scrollWidth'))===320);
// espaco reservado quadrado (sem foto)
await b.setWidth(375); await b.open(B+'sobre.html');
check('sobre: foto da equipe continua 16:9', await b.ev('(()=>{const r=document.querySelector(".photo-placeholder").getBoundingClientRect();return Math.abs(r.width/r.height-16/9)<0.05})()'));
// cardapio novo
await b.open(B+'index.html');
const nomes=await b.ev('[...document.querySelectorAll("#menu a.card h3")].map(h=>h.textContent)');
check('cardapio na ordem das fotos', JSON.stringify(nomes)===JSON.stringify(['Margherita','Pepperoni','Quatro Queijos','Cogumelos','Vegetariana','Frango com Barbecue']), JSON.stringify(nomes));
await b.open(B+'bebidas.html');
check('acompanhamentos de todas as pizzas existem em bebidas.js', (await b.ev('PIZZAS.every(p=>BEBIDAS.concat(SOBREMESAS).some(i=>i.nome===p.acompanhamento))'))===true);
await b.close(); process.exit(summary()?1:0);
