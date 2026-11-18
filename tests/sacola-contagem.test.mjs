import fs from 'node:fs';
import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Task 10: contagem da sacola, docs e telefone de exemplo');
const b = await launch(375);
const SEED=JSON.stringify([
  {tipo:'bebida',id:'guarana',qtd:2},
  {tipo:'pizza',id:'margherita',tamanho:'M',borda:true,qtd:1},
  {tipo:'pizza',id:'calabresa',tamanho:'P',borda:false,qtd:4},
  {tipo:'bebida',id:'nao-existe',qtd:5},
  {tipo:'sobremesa',id:'sumiu',qtd:3}
]);
await b.open(B+'bebidas.html');
await b.ev(`localStorage.setItem('bella-sacola', ${JSON.stringify(SEED)})`);
const pages=['index.html','pizza.html?id=margherita','bebidas.html','sobre.html','contato.html'];
for (const p of pages){
  await b.open(B+p);
  const r=await b.ev(`(()=>{try{const s=document.querySelector('.sacola-badge');return {n:s&&!s.hidden?s.textContent:'0',pizzas:typeof PIZZAS,bebidas:typeof BEBIDAS,label:document.querySelector('.sacola-fab')?.getAttribute('aria-label')}}catch(e){return 'ERR '+e.message}})()`);
  check(`${p}: botao mostra 3 (so itens que existem), dados carregados`, r && r.n==='3' && r.pizzas==='object' && r.bebidas==='object', JSON.stringify(r));
}
// pagina da sacola: so as 2 linhas validas, total certo
await b.open(B+'sacola.html');
const linhas=await b.ev('[...document.querySelectorAll(".sacola-item .sacola-nome")].map(e=>e.textContent)');
check('sacola.html: 2 linhas (Guaraná, Margherita)', JSON.stringify(linhas)===JSON.stringify(['Guaraná','Margherita']), JSON.stringify(linhas));
check('sacola.html: total R$ 74,60', (await b.ev('document.getElementById("sacola-total")?.textContent'))==='R$ 74,60');
// depois de adicionar algo, as linhas orfas saem do armazenamento
await b.open(B+'bebidas.html');
await b.ev('document.querySelector(".item .btn-add").click()');
const guardado=await b.ev('JSON.parse(localStorage.getItem("bella-sacola")).map(l=>l.id)');
check('linhas orfas removidas do armazenamento ao adicionar', JSON.stringify(guardado)===JSON.stringify(['guarana','margherita','suco-laranja']), JSON.stringify(guardado));

// telefone de exemplo da reserva
await b.open(B+'index.html');
check('placeholder do telefone com DDD 62', (await b.ev('document.querySelector("input[name=telefone]").placeholder')).startsWith('(62)'));

// documentacao e numero antigo
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.name==='.git'||e.name==='imagens-originais'||e.name==='.superpowers'||e.name==='images'||e.name==='.claude'?[]:e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const files=walk(ROOT.replace(/\/$/,'')).filter(f=>/\.(html|js|md|css)$/.test(f));
const velhos=files.filter(f=>/5511999990000|99999-0000/.test(fs.readFileSync(f,'utf8')));
check('numero antigo (5511999990000 / (11) 99999-0000) nao aparece em nenhum arquivo', velhos.length===0, velhos.join(','));
const md=fs.readFileSync(ROOT+'CLAUDE.md','utf8');
check('CLAUDE.md sem "numero de teste"', !/número de teste/.test(md));
check('CLAUDE.md documenta decoding="async" e dados em toda pagina com sacola.js', /decoding/.test(md) && /pizzas\.js.*bebidas\.js.*sacola\.js|sacola\.js.*pizzas\.js.*bebidas\.js/s.test(md));
await b.close(); process.exit(summary()?1:0);
