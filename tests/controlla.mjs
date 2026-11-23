/**
 * Il controllo intero, quello di `npm run check`: la sintassi di ogni file
 * e tutte le prove, una dopo l'altra. Un file o una prova in più entrano da
 * soli, senza toccare questo elenco.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const elenco = (cartella, fine) => readdirSync(join(radice, cartella)).filter((nome) => nome.endsWith(fine)).sort().map((nome) => join(cartella, nome));

function gira(argomenti, cosa) {
  const esito = spawnSync(process.execPath, argomenti, { cwd: radice, stdio: "inherit" });
  if (esito.status !== 0) {
    console.error(`\nFermo su: ${cosa}`);
    process.exit(esito.status ?? 1);
  }
}

const file = [...elenco("scripts", ".js"), ...elenco("tests", ".js"), ...elenco("tests", ".mjs"), ...elenco(join("tests", "finta"), ".mjs")];
for (const percorso of file) gira(["--check", percorso], `sintassi di ${percorso}`);
console.log(`Sintassi: ${file.length} file a posto.`);

for (const prova of elenco("tests", ".test.js")) gira([prova], prova);
console.log("Controllo finito: tutto a posto.");
