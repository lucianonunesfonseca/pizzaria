import { launch, check, summary, B } from './lib.mjs';
console.log('Sacola: depois de enviar o pedido');
const b = await launch(375);
const SEED = `[{"tipo":"bebida","id":"guarana","qtd":2},{"tipo":"pizza","id":"margherita","tamanho":"M","borda":true,"qtd":1}]`;
const semear = async () => {
  await b.open(B + 'bebidas.html');
  await b.ev(`localStorage.setItem('bella-sacola', '${SEED}'); sessionStorage.removeItem('bella-enviado'); 'ok'`);
};
// toca em "Enviar" sem sair da pagina (bloqueia a navegacao para o WhatsApp)
const enviarSemSair = () => b.ev(`(() => { window.navegarPara = () => {}; const f = document.getElementById('form-pedido'); f.elements['nome'].value = 'Ana'; f.querySelector('input[name=tipo][value=retirada]').click(); f.querySelector('input[name=pagamento][value=PIX]').click(); document.getElementById('enviar').click(); return sessionStorage.getItem('bella-enviado'); })()`);
const banner = () => b.ev('!!document.getElementById("pedido-enviado")');
const linhas = () => b.ev('document.querySelectorAll(".sacola-item").length');
const flag = () => b.ev('sessionStorage.getItem("bella-enviado")');

// 1) sem envio: sem pergunta, com botao Limpar
await semear(); await b.open(B + 'sacola.html');
check('sem envio: nao pergunta nada', (await banner()) === false);
check('botao "Limpar sacola" visivel e >= 44px', await b.ev('(() => { const x = document.getElementById("limpar"); return !!x && x.getBoundingClientRect().height >= 44 && /limpar sacola/i.test(x.textContent); })()'));

// 2) toca em Enviar -> marca; ao voltar (recarregar) pergunta
check('Enviar marca o pedido como enviado', (await enviarSemSair()) === '1');
await b.open(B + 'sacola.html');
check('ao voltar: pergunta se enviou, itens continuam na sacola', (await banner()) === true && (await linhas()) === 2);
check('pergunta acessivel (role status) e botoes >= 44px', await b.ev('(() => { const x = document.getElementById("pedido-enviado"); const s = document.getElementById("limpar-sim"), n = document.getElementById("limpar-nao"); return x.getAttribute("role") === "status" && /Sim, limpar a sacola/.test(s.textContent) && /Não, manter os itens/.test(n.textContent) && s.getBoundingClientRect().height >= 44 && n.getBoundingClientRect().height >= 44; })()'));
check('pergunta sem rolagem lateral (375)', (await b.ev('document.documentElement.scrollWidth')) === 375);
await b.setWidth(320); await b.open(B + 'sacola.html');
check('pergunta sem rolagem lateral (320)', (await b.ev('document.documentElement.scrollWidth')) === 320);
await b.setWidth(375); await b.open(B + 'sacola.html');

// 3) "Nao, manter"
await b.ev('document.getElementById("limpar-nao").click()');
check('"Nao, manter": some a pergunta, apaga a marca, mantem itens', (await banner()) === false && (await flag()) === null && (await linhas()) === 2);
await b.open(B + 'sacola.html');
check('depois de recarregar nao pergunta de novo', (await banner()) === false);

// 4) voltar sem recarregar (aba do iPhone reaparece): pageshow / visibilitychange
await enviarSemSair();
await b.ev('window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })); 1');
check('volta da aba (pageshow): a pergunta aparece sem recarregar', (await banner()) === true);
await b.ev('document.getElementById("limpar-nao").click()');
await enviarSemSair();
await b.ev('document.dispatchEvent(new Event("visibilitychange")); 1');
check('volta da aba (visibilitychange): a pergunta aparece', (await banner()) === true);

// 5) "Sim, limpar"
await b.ev('document.getElementById("limpar-sim").click()');
check('"Sim, limpar": sacola vazia, sem pergunta, sem marca', (await b.ev('lerSacola().length')) === 0 && (await banner()) === false && (await flag()) === null && (await b.ev('!!document.getElementById("sacola-vazia")')));
await b.open(B + 'bebidas.html');
check('botao flutuante zerado nas outras paginas', (await b.ev('(() => { const s = document.querySelector(".sacola-badge"); return !s || s.hidden; })()')) === true);

// 6) limpar manualmente, sem ter enviado
await semear(); await b.open(B + 'sacola.html');
await b.ev('document.getElementById("limpar").click()');
check('"Limpar sacola" esvazia na hora', (await b.ev('lerSacola().length')) === 0 && (await b.ev('!!document.getElementById("sacola-vazia")')) && (await b.ev('document.getElementById("limpar")')) === null);

// 7) sacola vazia + marca antiga: nao pergunta e apaga a marca
await b.open(B + 'bebidas.html');
await b.ev('localStorage.removeItem("bella-sacola"); sessionStorage.setItem("bella-enviado", "1"); 1');
await b.open(B + 'sacola.html');
check('vazia com marca antiga: sem pergunta e marca apagada', (await banner()) === false && (await flag()) === null);

// 8) sessionStorage bloqueado: nada quebra
await semear();
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window, "sessionStorage", { get() { throw new Error("bloqueado"); } })' });
await b.open(B + 'sacola.html');
const r = await b.ev(`(() => { try { window.navegarPara = () => {}; const f = document.getElementById('form-pedido'); f.elements['nome'].value = 'Ana'; f.querySelector('input[name=tipo][value=retirada]').click(); f.querySelector('input[name=pagamento][value=PIX]').click(); document.getElementById('enviar').click(); return document.getElementById('pedido-enviado') ? 'pergunta' : 'ok'; } catch (e) { return 'ERR ' + e.message; } })()`);
check('sessionStorage bloqueado: Enviar nao quebra e a pagina segue normal', r === 'ok', r);
await b.close();
process.exit(summary() ? 1 : 0);
