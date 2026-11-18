// Ajudantes dos testes: abre um Chrome/Edge sem janela e o controla pelo protocolo
// DevTools (sem instalar nada). Cada teste usa o próprio navegador e perfil temporário.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Pasta do site (com "/" no fim) e a mesma pasta como endereço file:// (também com "/" no fim).
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..').replace(/\\/g, '/') + '/';
export const B = pathToFileURL(ROOT).href;

const wait = ms => new Promise(r => setTimeout(r, ms));

function acharNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'
  ].filter(Boolean);
  const achado = candidatos.find(c => fs.existsSync(c));
  if (!achado) throw new Error('Chrome ou Edge não encontrado. Defina a variável CHROME_PATH com o caminho do executável.');
  return achado;
}

export async function launch(width = 375) {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'bella-teste-'));
  const chrome = spawn(acharNavegador(), [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${perfil}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank'
  ], { stdio: 'ignore' });

  let tabs = [];
  for (let i = 0; i < 60 && !tabs.some(t => t.type === 'page'); i++) {
    try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await wait(200); }
  }
  const aba = tabs.find(t => t.type === 'page');
  if (!aba) { chrome.kill(); throw new Error('O navegador não abriu a tempo.'); }

  const ws = new WebSocket(aba.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pend = {}; const dialogs = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend[m.id]) pend[m.id](m.result);
    if (m.method === 'Page.javascriptDialogOpening') { dialogs.push(m.params.message); send('Page.handleJavaScriptDialog', { accept: true }); }
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height: 812, deviceScaleFactor: 2, mobile: true });

  const ev = async ex => {
    const r = await send('Runtime.evaluate', { expression: ex, returnByValue: true, awaitPromise: true });
    return r.exceptionDetails ? ('ERR ' + r.exceptionDetails.exception.description) : r.result.value;
  };
  const open = async url => { await send('Page.navigate', { url }); await wait(900); };
  const setWidth = w => send('Emulation.setDeviceMetricsOverride', { width: w, height: 812, deviceScaleFactor: 2, mobile: true });
  const jsOff = off => send('Emulation.setScriptExecutionDisabled', { value: off });
  const close = async () => {
    const saiu = new Promise(r => chrome.once('exit', r));
    chrome.kill();
    await Promise.race([saiu, wait(3000)]);
    await wait(500); // processos filhos do navegador ainda podem segurar arquivos do perfil
    try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 15, retryDelay: 300 }); } catch {}
  };
  return { send, ev, open, wait, setWidth, jsOff, dialogs, close };
}

let fails = 0, passes = 0;
export function check(name, cond, detail = '') {
  if (cond) { passes++; console.log('  PASS', name); }
  else { fails++; console.log('  FAIL', name, detail ? ('-> ' + detail) : ''); }
}
export function summary() { console.log(`\n${passes} passed, ${fails} failed`); return fails; }
