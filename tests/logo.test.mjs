import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Task 9: logo com espaco');
const b = await launch(375);
for (const w of [375,320,800]){
  await b.setWidth(w);
  for (const p of ['index.html','bebidas.html','pizza.html?id=margherita','sacola.html']){
    await b.open(B+p);
    const r=await b.ev(`(()=>{const br=document.querySelector('.brand');const t=br.firstChild;const rg=document.createRange();rg.setStart(t,0);rg.setEnd(t,5);const a=rg.getBoundingClientRect();const s=br.querySelector('span').getBoundingClientRect();return {gap:Math.round((s.left-a.right)*10)/10,h:Math.round(br.getBoundingClientRect().height)}})()`);
    check(`${w}px ${p}: espaco entre "Bella" e "Massa" (${r.gap}px), logo >=44px (${r.h})`, r.gap>=3 && r.h>=44);
  }
}
await b.close(); process.exit(summary()?1:0);
