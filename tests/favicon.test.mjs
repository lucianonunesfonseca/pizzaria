import fs from 'node:fs';
import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Favicon e icone do iPhone');

const dimensoes = f => {
  if (!fs.existsSync(ROOT + f)) return null;
  const d = fs.readFileSync(ROOT + f);
  return d.slice(0, 8).toString('hex') === '89504e470d0a1a0a' ? [d.readUInt32BE(16), d.readUInt32BE(20)] : null;
};
const svg = fs.existsSync(ROOT + 'favicon.svg') ? fs.readFileSync(ROOT + 'favicon.svg', 'utf8') : '';
check('favicon.svg existe e e um SVG com viewBox', /<svg[^>]*viewBox/.test(svg));
check('favicon-32.png tem 32x32', JSON.stringify(dimensoes('favicon-32.png')) === '[32,32]', JSON.stringify(dimensoes('favicon-32.png')));
check('apple-touch-icon.png tem 180x180', JSON.stringify(dimensoes('apple-touch-icon.png')) === '[180,180]', JSON.stringify(dimensoes('apple-touch-icon.png')));
check('icones leves (cada um <= 20 KB)', ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'].every(f => fs.existsSync(ROOT + f) && fs.statSync(ROOT + f).size <= 20 * 1024));

const paginas = ['index.html', 'pizza.html?id=margherita', 'bebidas.html', 'sacola.html', 'sobre.html', 'contato.html'];
const b = await launch(375);
for (const p of paginas) {
  await b.open(B + p);
  const l = await b.ev(`({
    svg: document.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute('href'),
    png: document.querySelector('link[rel="icon"][sizes="32x32"]')?.getAttribute('href'),
    apple: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href')
  })`);
  check(p + ': links dos 3 icones no head', l && l.svg === 'favicon.svg' && l.png === 'favicon-32.png' && l.apple === 'apple-touch-icon.png', JSON.stringify(l));
}
await b.open(B + 'index.html');
const carregam = await b.ev(`Promise.all(['favicon.svg','favicon-32.png','apple-touch-icon.png'].map(f => new Promise(r => {
  const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = f;
})))`);
check('os 3 icones carregam no navegador', JSON.stringify(carregam) === '[true,true,true]', JSON.stringify(carregam));
await b.close();
process.exit(summary() ? 1 : 0);
