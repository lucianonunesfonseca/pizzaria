// Roda os testes (*.test.mjs) em paralelo e mostra um resumo.
//   node tests/run.mjs            todos
//   node tests/run.mjs sacola     só os arquivos cujo nome contém "sacola"
//   node tests/run.mjs -v         mostra também as verificações que passaram
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const verboso = args.includes('-v');
const filtro = args.find(a => a !== '-v');
const arquivos = fs.readdirSync(dir).filter(f => f.endsWith('.test.mjs') && (!filtro || f.includes(filtro))).sort();
if (!arquivos.length) { console.log('Nenhum teste encontrado.'); process.exit(1); }

const SIMULTANEOS = 3, LIMITE_MS = 240000;
let proximo = 0, comFalha = 0, totalOk = 0, totalFalhas = 0;
const inicio = Date.now();

function rodar(arquivo) {
  return new Promise(resolve => {
    const filho = spawn(process.execPath, [path.join(dir, arquivo)], { stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    filho.stdout.on('data', d => saida += d);
    filho.stderr.on('data', d => saida += d);
    const timer = setTimeout(() => { saida += '\n  FAIL tempo esgotado'; filho.kill(); }, LIMITE_MS);
    filho.on('close', codigo => { clearTimeout(timer); resolve({ arquivo, saida, codigo }); });
  });
}

async function trabalhador() {
  while (proximo < arquivos.length) {
    const r = await rodar(arquivos[proximo++]);
    const m = r.saida.match(/(\d+) passed, (\d+) failed/);
    const ok = m ? +m[1] : 0, falhas = m ? +m[2] : 1;
    totalOk += ok; totalFalhas += falhas;
    const falhou = falhas > 0 || r.codigo !== 0 || !m;
    if (falhou) comFalha++;
    console.log(`${falhou ? 'FALHOU' : 'ok    '} ${r.arquivo}  (${ok} passaram, ${falhas} falharam)`);
    const linhas = r.saida.split('\n').filter(l => verboso || !/^\s+PASS/.test(l));
    if (falhou || verboso) console.log(linhas.filter(l => l.trim()).map(l => '    ' + l).join('\n'));
  }
}

await Promise.all(Array.from({ length: SIMULTANEOS }, trabalhador));
console.log(`\n${arquivos.length} arquivos, ${totalOk} verificações ok, ${totalFalhas} falhas, ${Math.round((Date.now() - inicio) / 1000)} s`);
process.exit(comFalha ? 1 : 0);
