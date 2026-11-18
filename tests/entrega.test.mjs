import { launch, check, summary, B } from './lib.mjs';
console.log('Sacola: dados de entrega, pagamento e mensagem');
const b = await launch(375);

const SEED = `[{"tipo":"bebida","id":"guarana","qtd":2},{"tipo":"pizza","id":"margherita","tamanho":"M","borda":true,"qtd":1}]`;
const ITENS = 'Olá! Quero fazer este pedido:\n2x Guaraná — R$ 12,00\n1x Margherita (M, com borda) — R$ 62,60';
const semear = async () => {
  await b.open(B + 'bebidas.html');
  await b.ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('bella-sacola', '${SEED}'); 'ok'`);
  await b.open(B + 'sacola.html');
};
const f = (js) => b.ev(`(() => { const f = document.getElementById('form-pedido'); ${js} })()`);
const escolher = (nome, valor) => f(`f.querySelector('input[name=${nome}][value="${valor}"]').click(); return 1;`);
const digitar = (nome, valor) => f(`f.elements['${nome}'].value = ${JSON.stringify(valor)}; f.elements['${nome}'].dispatchEvent(new Event('input', { bubbles: true })); return 1;`);
const msg = () => b.ev('decodeURIComponent(linkPedidoSacola(lerDadosFormulario()).split("text=")[1])');
const total = () => b.ev('document.getElementById("sacola-total").textContent');
const visivel = (id) => b.ev(`(() => { const e = document.getElementById('${id}'); return !!e && !e.hidden && e.getBoundingClientRect().height > 0; })()`);

await semear();
// --- configuracao do negocio
check('configuracao: taxa R$ 7, 4 formas de pagamento, endereco de retirada', await b.ev(`TAXA_ENTREGA === 7 && JSON.stringify(FORMAS_PAGAMENTO) === JSON.stringify(['Dinheiro','PIX','Cartão de débito','Cartão de crédito']) && ENDERECO_RETIRADA === 'Rua A, Jardim Florença, Itaberaí-GO'`));

// --- formulario so aparece com itens, sem opcao pre-escolhida
check('com itens: formulario visivel', await visivel('form-pedido'));
check('nenhuma opcao pre-escolhida (entrega/retirada e pagamento)', await f(`return !f.querySelector('input[name=tipo]:checked') && !f.querySelector('input[name=pagamento]:checked');`));
check('sem escolher: total so dos itens (R$ 74,60) e sem taxa', (await total()) === 'R$ 74,60' && !(await visivel('linha-taxa')));
check('pagamento: 4 opcoes na ordem', JSON.stringify(await f(`return [...f.querySelectorAll('input[name=pagamento]')].map(i => i.value);`)) === JSON.stringify(['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito']));
check('formulario invalido enquanto vazio', (await f('return f.checkValidity();')) === false);

// --- entrega
await escolher('tipo', 'entrega');
check('entrega: mostra campos de endereco, taxa R$ 7,00 e total R$ 81,60', (await visivel('campos-entrega')) && (await visivel('linha-taxa')) && (await b.ev('document.getElementById("sacola-taxa").textContent')) === 'R$ 7,00' && (await total()) === 'R$ 81,60');
check('entrega: nome, rua, bairro obrigatorios', await f(`return ['nome','rua','bairro'].every(n => f.elements[n].required);`));
check('entrega: nao mostra o endereco de retirada', !(await visivel('info-retirada')));

// --- retirada
await escolher('tipo', 'retirada');
check('retirada: sem taxa, total R$ 74,60, mostra endereco do balcao', !(await visivel('linha-taxa')) && (await total()) === 'R$ 74,60' && (await visivel('info-retirada')) && (await b.ev('document.getElementById("info-retirada").textContent')).includes('Rua A, Jardim Florença, Itaberaí-GO'));
check('retirada: campos de endereco escondidos e nao obrigatorios', !(await visivel('campos-entrega')) && await f(`return !f.elements['rua'].required && !f.elements['bairro'].required;`));

// --- troco so para dinheiro
await escolher('pagamento', 'PIX');
check('PIX: sem campo de troco', !(await visivel('campo-troco')));
await escolher('pagamento', 'Dinheiro');
check('Dinheiro: campo de troco (opcional)', (await visivel('campo-troco')) && await f(`return !f.elements['troco'].required;`));

// --- validacao
check('retirada + nome vazio: invalido', (await f('return f.checkValidity();')) === false);
await digitar('nome', 'Ana Souza');
check('retirada + nome + pagamento: valido', (await f('return f.checkValidity();')) === true);
await escolher('tipo', 'entrega');
check('entrega sem endereco: invalido', (await f('return f.checkValidity();')) === false);

// --- mensagem: entrega com dinheiro e troco
await digitar('rua', 'Rua das Flores, 123');
await digitar('bairro', 'Centro');
await digitar('complemento', 'apto 4');
await digitar('troco', '150');
await digitar('obs', 'sem cebola');
check('entrega + dinheiro: formulario valido', (await f('return f.checkValidity();')) === true);
check('mensagem de entrega completa (subtotal, taxa, total, endereco, troco, obs)',
  (await msg()) === ITENS + '\nSubtotal: R$ 74,60\nTaxa de entrega: R$ 7,00\nTotal: R$ 81,60\nNome: Ana Souza\nEntrega: Rua das Flores, 123 - Centro (apto 4)\nPagamento: Dinheiro (troco para R$ 150,00)\nObs: sem cebola', await msg());

// --- mensagem: retirada com PIX (sem troco, sem obs, sem taxa)
await escolher('tipo', 'retirada');
await escolher('pagamento', 'PIX');
await digitar('obs', '');
check('mensagem de retirada com PIX (sem taxa, sem troco, sem obs)',
  (await msg()) === ITENS + '\nTotal: R$ 74,60\nNome: Ana Souza\nRetirada no balcão: Rua A, Jardim Florença, Itaberaí-GO\nPagamento: PIX', await msg());

// --- troco: texto livre, e ignorado fora do dinheiro
await escolher('pagamento', 'Dinheiro');
await digitar('troco', 'uma nota de 100');
check('troco em texto livre vai como escrito', (await msg()).endsWith('Pagamento: Dinheiro (troco para uma nota de 100)'));
await digitar('troco', '');
check('dinheiro sem troco: so "Pagamento: Dinheiro"', (await msg()).endsWith('Pagamento: Dinheiro'));
await digitar('troco', '80,50');
await escolher('pagamento', 'Cartão de crédito');
check('troco ignorado quando nao e dinheiro', (await msg()).endsWith('Pagamento: Cartão de crédito'));

// --- seguranca e limites
await digitar('nome', '<img src=x onerror=alert(1)>');
check('texto digitado nunca vira HTML (vai literal na mensagem)', (await msg()).includes('Nome: <img src=x onerror=alert(1)>') && (await b.ev('document.querySelectorAll("img[src=x]").length')) === 0 && b.dialogs.length === 0);
await f(`f.elements['nome'].value = 'x'.repeat(300); f.elements['obs'].value = 'y'.repeat(900); return 1;`);
check('limites de tamanho (maxlength e corte ao ler)', await b.ev(`(() => { const d = lerDadosFormulario(); const f = document.getElementById('form-pedido'); return d.nome.length === 60 && d.obs.length === 200 && ['nome','rua','bairro','complemento','troco','obs'].every(n => f.elements[n].maxLength > 0); })()`));

// --- envio: so com formulario valido; grava dados; marca envio
await semear();
const preparar = () => f(`window.__urls = []; window.navegarPara = u => window.__urls.push(u); return 1;`);
await preparar();
await b.ev('document.getElementById("enviar").click()');
check('formulario incompleto: nao navega e nao marca envio', (await b.ev('window.__urls.length')) === 0 && (await b.ev('sessionStorage.getItem("bella-enviado")')) === null);
await escolher('tipo', 'entrega'); await digitar('nome', 'Ana Souza'); await digitar('rua', 'Rua das Flores, 123'); await digitar('bairro', 'Centro'); await escolher('pagamento', 'PIX');
await b.ev('document.getElementById("enviar").click()');
const url = await b.ev('window.__urls[0] || ""');
check('formulario valido: navega (mesma aba) para o WhatsApp (62 99845-2828) com a mensagem', url.startsWith('https://wa.me/5562998452828?text=') && decodeURIComponent(url.split('text=')[1]) === ITENS + '\nSubtotal: R$ 74,60\nTaxa de entrega: R$ 7,00\nTotal: R$ 81,60\nNome: Ana Souza\nEntrega: Rua das Flores, 123 - Centro\nPagamento: PIX', url);
check('envio marca o pedido como enviado', (await b.ev('sessionStorage.getItem("bella-enviado")')) === '1');
check('dados salvos neste aparelho (lembrar marcado)', await b.ev(`(() => { const c = JSON.parse(localStorage.getItem('bella-cliente') || 'null'); return !!c && c.nome === 'Ana Souza' && c.tipo === 'entrega' && c.rua === 'Rua das Flores, 123' && c.bairro === 'Centro' && c.pagamento === 'PIX' && !('obs' in c) && !('troco' in c); })()`));

// --- dados lembrados: preenche na proxima vez
await b.open(B + 'sacola.html');
check('proxima visita: campos ja preenchidos e total com a taxa', await f(`return f.elements['nome'].value === 'Ana Souza' && f.querySelector('input[name=tipo]:checked')?.value === 'entrega' && f.elements['rua'].value === 'Rua das Flores, 123' && f.elements['bairro'].value === 'Centro' && f.querySelector('input[name=pagamento]:checked')?.value === 'PIX' && f.elements['lembrar'].checked;`) && (await total()) === 'R$ 81,60');

// --- desmarcar "lembrar" apaga o que estava guardado
await f(`f.elements['lembrar'].click(); return 1;`);
check('desmarcar "Lembrar meus dados" apaga os dados guardados', (await b.ev('localStorage.getItem("bella-cliente")')) === null);
await preparar();
await b.ev('document.getElementById("enviar").click()');
check('enviar com "lembrar" desmarcado nao grava nada', (await b.ev('window.__urls.length')) === 1 && (await b.ev('localStorage.getItem("bella-cliente")')) === null);

// --- dados guardados corrompidos nao quebram
for (const v of ['{oops', '"texto"', '{"tipo":"voando","pagamento":"Fiado","nome":123}']) {
  await b.open(B + 'bebidas.html');
  await b.ev(`localStorage.setItem('bella-cliente', ${JSON.stringify(v)}); 1`);
  await b.open(B + 'sacola.html');
  const r = await f(`return { tipo: !!f.querySelector('input[name=tipo]:checked'), pag: !!f.querySelector('input[name=pagamento]:checked'), nome: f.elements['nome'].value };`);
  check('dados guardados invalidos (' + v.slice(0, 12) + '...): ignorados, formulario em branco', r && !r.tipo && !r.pag && r.nome === '', JSON.stringify(r));
}

// --- acessibilidade e layout
await semear();
check('campos com rotulo e grupos com legenda', await f(`const campos = [...f.querySelectorAll('input:not([type=radio]):not([type=checkbox]), textarea')]; return campos.every(c => c.labels && c.labels.length > 0) && f.querySelectorAll('fieldset > legend').length >= 2;`));
await escolher('tipo', 'entrega'); await escolher('pagamento', 'Dinheiro');
check('alvos de toque >= 44px (opcoes, campos, botao)', await f(`return [...f.querySelectorAll('.opcao, input[type=text], textarea, #enviar')].filter(e => e.getBoundingClientRect().height > 0).every(e => e.getBoundingClientRect().height >= 44);`));
check('sem rolagem lateral (375)', (await b.ev('document.documentElement.scrollWidth')) === 375);
await b.setWidth(320); await b.open(B + 'sacola.html');
await escolher('tipo', 'entrega'); await escolher('pagamento', 'Dinheiro');
check('sem rolagem lateral (320, entrega + dinheiro)', (await b.ev('document.documentElement.scrollWidth')) === 320);
await b.setWidth(375);

// --- sacola vazia esconde o formulario
await b.open(B + 'bebidas.html'); await b.ev('localStorage.removeItem("bella-sacola"); 1');
await b.open(B + 'sacola.html');
check('sacola vazia: formulario escondido', (await b.ev('document.getElementById("form-pedido").hidden')) === true);
await b.close();
process.exit(summary() ? 1 : 0);
