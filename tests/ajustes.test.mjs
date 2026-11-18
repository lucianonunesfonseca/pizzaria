import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Task 7: ajustes menores');
const b = await launch(375);
const pages=['index.html','sobre.html','contato.html','bebidas.html','sacola.html','pizza.html?id=margherita'];

// 1) "e" antes do ultimo ingrediente
await b.open(B+'index.html');
const ing=await b.ev('[...document.querySelectorAll("#menu a.card")].map(a=>a.querySelector("p").textContent)');
const esperado=[
 'Molho de tomate, mussarela e manjericão fresco.',
 'Molho de tomate, mussarela e pepperoni.',
 'Mussarela, gorgonzola, ricota e parmesão.',
 'Molho de tomate, mussarela e cogumelos frescos.',
 'Molho de tomate, mussarela, pimentão, cebola roxa, azeitonas pretas e tomate.',
 'Mussarela, frango grelhado, cebola roxa e molho barbecue.'];
check('cards: "e" antes do ultimo ingrediente (6 pizzas)', JSON.stringify(ing)===JSON.stringify(esperado), JSON.stringify(ing));
check('lista com 0, 1, 2 e 3 itens', (await b.ev('listaComE(["a"])==="a" && listaComE(["a","b"])==="a e b" && listaComE(["a","b","c"])==="a, b e c" && listaComE([])===""'))===true);

// 2) logo com area de toque >= 44px (todas as paginas, estreito e largo)
for (const w of [375,320,800]){
  await b.setWidth(w);
  for (const p of pages){
    await b.open(B+p);
    const h=await b.ev('Math.round(document.querySelector(".brand").getBoundingClientRect().height)');
    const bar=await b.ev('Math.round(document.querySelector(".topbar").getBoundingClientRect().height)');
    check(`${w}px ${p}: logo >=44px (${h}), barra <=100px (${bar})`, h>=44 && bar<=100);
  }
}

// 3) links do aviso sem JS com altura >= 44px
await b.setWidth(375);
await b.jsOff(true);
for (const p of ['index.html','pizza.html?id=margherita','bebidas.html','sacola.html']){
  await b.open(B+p);
  const h=await b.ev('Math.round(document.querySelector("noscript a, .aviso a")?.getBoundingClientRect().height||0)');
  check('sem JS '+p+': link do aviso >=44px ('+h+')', h>=44);
}
await b.jsOff(false);

// 4) foto errada cai no espaco reservado (copia do site com imagem inexistente)
const SRC=ROOT, DST=fs.mkdtempSync(os.tmpdir().replace(/\\/g,'/')+'/bella-site-').replace(/\\/g,'/')+'/';
fs.rmSync(DST,{recursive:true,force:true}); fs.mkdirSync(DST,{recursive:true});
for (const f of fs.readdirSync(SRC)) if (/\.(html|js|css)$/.test(f)) fs.copyFileSync(SRC+f, DST+f);
let pj=fs.readFileSync(DST+'pizzas.js','utf8').replace(/imagem: "[^"]*"/,'imagem: "nao-existe.jpg"');
fs.writeFileSync(DST+'pizzas.js',pj);
let bj=fs.readFileSync(DST+'bebidas.js','utf8').replace(/imagem: "[^"]*"/,'imagem: "nao-existe.jpg"');
fs.writeFileSync(DST+'bebidas.js',bj);
await b.open(pathToFileURL(DST).href+'pizza.html?id=margherita'); await b.wait(500);
check('pizza com foto inexistente: espaco reservado, sem img', (await b.ev('!!document.querySelector(".photo-placeholder")')) && (await b.ev('document.querySelectorAll("main img").length'))===0);
await b.open(pathToFileURL(DST).href+'bebidas.html'); await b.wait(500);
for (let k=0;k<9;k++){ await b.ev(`document.querySelectorAll('.item .item-foto').length>${k}&&document.querySelectorAll('.item .item-foto')[${k}].scrollIntoView({behavior:'instant',block:'center'})`); await b.wait(250); }
await b.wait(600);
check('bebida com foto inexistente: espaco reservado, sem img', (await b.ev('document.querySelectorAll(".item .photo-placeholder").length'))===9 && (await b.ev('document.querySelectorAll(".item img").length'))===0);
check('foto inexistente: layout sem rolagem lateral', (await b.ev('document.documentElement.scrollWidth'))===375);
await b.close(); fs.rmSync(DST,{recursive:true,force:true}); process.exit(summary()?1:0);
