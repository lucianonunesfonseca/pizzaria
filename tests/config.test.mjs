import fs from 'node:fs';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { launch, check, summary, B, ROOT } from './lib.mjs';
console.log('Configuracao central (numero do WhatsApp) e barra do topo unica');

const ler = f => fs.readFileSync(ROOT + f, 'utf8');
const paginas = ['index.html', 'pizza.html?id=margherita', 'bebidas.html', 'sacola.html', 'sobre.html', 'contato.html'];
const htmls = ['index.html', 'pizza.html', 'bebidas.html', 'sacola.html', 'sobre.html', 'contato.html'];
const cfg = fs.existsSync(ROOT + 'config.js') ? ler('config.js') : '';
const numero = (cfg.match(/WHATSAPP_NUMERO\s*=\s*"(\d+)"/) || [])[1];
const telefone = (cfg.match(/TELEFONE_EXIBIDO\s*=\s*"([^"]+)"/) || [])[1];

// ---- o numero esta em um lugar so (alem dos avisos sem JavaScript)
check('config.js define o numero (55 + DDD + numero) e o telefone exibido', /^55\d{10,11}$/.test(numero || '') && !!telefone, `${numero} ${telefone}`);
const comNumeroFixo = [...htmls, 'sacola.js', 'layout.js', 'pizzas.js', 'bebidas.js', 'style.css']
  .filter(f => fs.existsSync(ROOT + f) && /wa\.me\/\d/.test(ler(f)));
check('numero fixo so nos avisos sem JavaScript (index, pizza, bebidas, sacola)',
  JSON.stringify(comNumeroFixo.sort()) === JSON.stringify(['bebidas.html', 'index.html', 'pizza.html', 'sacola.html']), comNumeroFixo.join(','));
check('esses avisos usam o mesmo numero do config.js',
  comNumeroFixo.every(f => [...ler(f).matchAll(/wa\.me\/(\d+)/g)].every(m => m[1] === numero)));
const comTelefone = [...htmls, 'sacola.js', 'layout.js', 'style.css'].filter(f => telefone && ler(f).includes(telefone));
check('telefone exibido so no config.js', comTelefone.length === 0, comTelefone.join(','));
check('config.js concentra taxa, pagamentos e endereco de retirada (saiu do sacola.js)',
  /TAXA_ENTREGA\s*=/.test(cfg) && /FORMAS_PAGAMENTO\s*=/.test(cfg) && /ENDERECO_RETIRADA\s*=/.test(cfg) && !/var (TAXA_ENTREGA|FORMAS_PAGAMENTO|ENDERECO_RETIRADA)\s*=/.test(ler('sacola.js')));

// ---- a barra do topo existe uma vez so (layout.js)
check('nenhuma pagina tem a barra copiada; todas usam #topbar + layout.js',
  htmls.every(f => { const t = ler(f); return !t.includes('class="nav-links"') && t.includes('id="topbar"') && t.includes('<script src="layout.js"></script>') && t.includes('<script src="config.js"></script>'); }));

const b = await launch(375);
const marca = html => html.replace(/ aria-current="page"/g, '');
const barras = {};
const atual = { 'index.html': null, 'pizza.html?id=margherita': null, 'bebidas.html': 'Bebidas', 'sacola.html': null, 'sobre.html': 'Sobre', 'contato.html': 'Contato' };
for (const p of paginas) {
  await b.open(B + p);
  barras[p] = await b.ev(`document.getElementById('topbar').outerHTML`);
  const r = await b.ev(`({ links: [...document.querySelectorAll('#topbar .nav-link')].map(a => a.textContent + '|' + a.getAttribute('href')), atual: document.querySelector('#topbar [aria-current]')?.textContent ?? null, marca: !!document.querySelector('#topbar .brand span') })`);
  check(`${p}: barra com 4 links, logo e pagina atual correta`,
    JSON.stringify(r.links) === JSON.stringify(['Cardápio|index.html#cardapio', 'Bebidas|bebidas.html', 'Sobre|sobre.html', 'Contato|contato.html']) && r.atual === atual[p] && r.marca, JSON.stringify(r));
}
check('barra identica em todas as paginas (fora a pagina atual)', new Set(Object.values(barras).map(marca)).size === 1);
check('todos os links da barra apontam para arquivos que existem', ['index.html', 'bebidas.html', 'sobre.html', 'contato.html'].every(f => fs.existsSync(ROOT + f)));

// ---- sem pulo de layout: com e sem JavaScript a barra ocupa a mesma altura
for (const w of [375, 800]) {
  await b.setWidth(w);
  for (const p of ['index.html', 'bebidas.html']) {
    await b.jsOff(true); await b.open(B + p);
    const sem = await b.ev(`({ barra: Math.round(document.getElementById('topbar').getBoundingClientRect().height), topo: Math.round(document.querySelector('.hero').getBoundingClientRect().top), logo: !!document.querySelector('#topbar .brand') })`);
    await b.jsOff(false); await b.open(B + p);
    const com = await b.ev(`({ barra: Math.round(document.getElementById('topbar').getBoundingClientRect().height), topo: Math.round(document.querySelector('.hero').getBoundingClientRect().top) })`);
    check(`${w}px ${p}: mesma altura da barra com e sem JS (${sem.barra}/${com.barra}), logo presente sem JS`, Math.abs(sem.barra - com.barra) <= 1 && Math.abs(sem.topo - com.topo) <= 1 && sem.logo, JSON.stringify({ sem, com }));
  }
}
await b.setWidth(375);

// ---- botoes e telefone preenchidos pelo config.js
await b.open(B + 'index.html');
const hero = await b.ev(`[...document.querySelectorAll('a[data-whatsapp]')].map(a => a.getAttribute('href'))`);
const esperado = `https://wa.me/${numero}?text=` + encodeURIComponent('Olá! Gostaria de fazer um pedido.');
check('index: botoes "Pedir no WhatsApp" (topo e final) com o numero do config', hero.length === 2 && hero.every(h => h === esperado), JSON.stringify(hero));
check('index: telefone exibido vem do config', (await b.ev(`document.querySelector('.phone').textContent`)) === telefone);
await b.open(B + 'bebidas.html');
check('bebidas: telefone exibido vem do config', (await b.ev(`document.querySelector('.phone').textContent`)) === telefone);

// ---- os formularios de reserva e contato usam linkWhatsApp
const sentinela = `window.linkWhatsApp = m => 'about:blank#' + encodeURIComponent(m); 1`;
await b.open(B + 'contato.html'); await b.ev(sentinela);
await b.ev(`(() => { const f = document.getElementById('form-contato'); f.elements['nome'].value = 'Ana'; f.elements['email'].value = 'a@b.co'; f.elements['mensagem'].value = 'oi'; f.requestSubmit(); })()`);
await b.wait(500);
check('contato: o envio usa linkWhatsApp com a mensagem', (await b.ev('decodeURIComponent(location.hash)')).startsWith('#Olá! Meu nome é Ana'), await b.ev('location.href'));
await b.open(B + 'index.html'); await b.ev(sentinela);
await b.ev(`(() => { const f = document.getElementById('form-reserva'); f.elements['nome'].value = 'Ana'; f.elements['telefone'].value = '62'; f.elements['pessoas'].value = '2'; f.elements['data'].value = '2030-01-02'; f.requestSubmit(); })()`);
await b.wait(500);
check('reserva: o envio usa linkWhatsApp com a mensagem', (await b.ev('decodeURIComponent(location.hash)')).includes('reservar uma mesa'), await b.ev('location.href'));

// ---- prova da centralizacao: trocar o numero em config.js muda o site inteiro (copia do site)
const DST = fs.mkdtempSync(os.tmpdir().replace(/\\/g, '/') + '/bella-config-').replace(/\\/g, '/') + '/';
for (const f of fs.readdirSync(ROOT)) if (/\.(html|js|css)$/.test(f)) fs.copyFileSync(ROOT + f, DST + f);
fs.writeFileSync(DST + 'config.js', fs.readFileSync(DST + 'config.js', 'utf8').replace(numero, '5511912345678').replace(telefone, '(11) 91234-5678'));
const U = pathToFileURL(DST).href;
await b.open(U + 'index.html');
check('copia: botoes do index passam a usar o numero novo', (await b.ev(`[...document.querySelectorAll('a[data-whatsapp]')].every(a => a.getAttribute('href').startsWith('https://wa.me/5511912345678?text='))`)) === true && (await b.ev(`document.querySelector('.phone').textContent`)) === '(11) 91234-5678');
await b.open(U + 'bebidas.html');
await b.ev(`localStorage.setItem('bella-sacola', '[{"tipo":"bebida","id":"guarana","qtd":1}]'); 1`);
await b.open(U + 'sacola.html');
check('copia: o pedido da sacola passa a usar o numero novo', await b.ev(`(() => { const f = document.getElementById('form-pedido'); f.elements['nome'].value = 'Ana'; f.querySelector('input[name=tipo][value=retirada]').click(); f.querySelector('input[name=pagamento][value=PIX]').click(); return linkPedidoSacola(lerDadosFormulario()).startsWith('https://wa.me/5511912345678?text='); })()`));
await b.ev(`localStorage.clear(); 1`);
await b.close(); fs.rmSync(DST, { recursive: true, force: true });
process.exit(summary() ? 1 : 0);
