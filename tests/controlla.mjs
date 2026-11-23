/**
 * Il controllo intero, quello di `npm run check`: la sintassi di ogni file,
 * i nomi non dichiarati e tutte le prove, una dopo l'altra. Un file o una prova in più entrano da
 * soli, senza toccare questo elenco.
 *
 *   tests/*.test.js        le regole e le schede, senza Foundry
 *   tests/base/*.test.js   la base del sistema
 *   tests/finta/*.mjs      le prove con la finta Foundry (i pezzi della base rimpiazzati dai finti)
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** I file di una cartella, anche nelle sue sottocartelle, con una delle estensioni date. */
function sotto(cartella, estensioni) {
  return readdirSync(join(radice, cartella), { withFileTypes: true, recursive: true })
    .filter((voce) => voce.isFile() && estensioni.some((fine) => voce.name.endsWith(fine)))
    .map((voce) => relative(radice, join(voce.parentPath ?? voce.path, voce.name)))
    .sort();
}

/** I file di una cartella sola, senza scendere. */
const elenco = (cartella, fine) => readdirSync(join(radice, cartella)).filter((nome) => nome.endsWith(fine)).sort().map((nome) => join(cartella, nome));

function gira(argomenti, cosa) {
  const esito = spawnSync(process.execPath, argomenti, { cwd: radice, stdio: "inherit" });
  if (esito.status !== 0) {
    console.error(`\nFermo su: ${cosa}`);
    process.exit(esito.status ?? 1);
  }
}

const file = [...sotto("scripts", [".js"]), ...sotto("tests", [".js", ".mjs"]), ...sotto("tools", [".mjs"])];
for (const percorso of file) gira(["--check", percorso], `sintassi di ${percorso}`);
console.log(`Sintassi: ${file.length} file a posto.`);

// Nessun nome usato senza essere dichiarato o importato: un errore così, dentro Foundry, si vede solo al clic.
gira([join("node_modules", "eslint", "bin", "eslint.js"), "scripts"], "i nomi non dichiarati negli script");
console.log("Nomi: tutti dichiarati.");

const prove = [...elenco("tests", ".test.js"), ...elenco(join("tests", "base"), ".test.js")];
for (const prova of prove) gira([prova], prova);

const ATTREZZI = ["loader.mjs", "register.mjs"];
const finte = elenco(join("tests", "finta"), ".mjs").filter((percorso) => !ATTREZZI.some((nome) => percorso.endsWith(nome)));
for (const prova of finte) gira(["--import", "./tests/finta/register.mjs", prova], prova);

console.log(`Controllo finito: ${prove.length + finte.length} prove, tutto a posto.`);
