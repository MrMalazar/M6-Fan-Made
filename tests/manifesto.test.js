/**
 * Il pacchetto com'è su disco: il manifesto è coerente, i file che nomina
 * esistono, e ogni parola che il codice chiede sta nel file di lingua.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ID, TUTTE_ABILITA, TUTTI_ATTRIBUTI, CAMPI } from "../scripts/costanti.js";
import { SCELTE } from "../scripts/modo.js";
import { SEGNI } from "../scripts/salute.js";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const leggi = (percorso) => readFileSync(join(radice, percorso), "utf8");
const json = (percorso) => JSON.parse(leggi(percorso));
const elenco = (cartella, fine) => readdirSync(join(radice, cartella), { recursive: true }).map(String).filter((nome) => nome.endsWith(fine)).map((nome) => `${cartella}/${nome.replaceAll("\\", "/")}`);

const manifesto = json("system.json");
const pacco = json("package.json");

// Il manifesto: la sigla, il titolo di Blue, la versione uguale dappertutto.
assert.equal(manifesto.id, ID);
assert.equal(manifesto.title, "Maghi 6ª Edizione - Fan Made");
assert.match(manifesto.version, /^\d+\.\d+\.\d+$/);
assert.equal(pacco.version, manifesto.version, "package.json e system.json dicono la stessa versione");
assert.equal(manifesto.manifest, "https://github.com/MrMalazar/M6-Fan-Made/releases/latest/download/system.json");
assert.equal(manifesto.download, `https://github.com/MrMalazar/M6-Fan-Made/releases/download/${manifesto.version}/m6.zip`);
assert.equal(manifesto.compatibility.minimum, "14");

// I tipi che il sistema dichiara sono quelli che il codice registra.
assert.deepEqual(Object.keys(manifesto.documentTypes.Actor), ["mago", "png"]);
assert.deepEqual(Object.keys(manifesto.documentTypes.ChatMessage), ["tiro"]);
assert.equal(manifesto.documentTypes.Item, undefined, "gli oggetti arrivano alla loro tappa");

// Ogni file nominato esiste.
for (const percorso of [...manifesto.esmodules, ...manifesto.styles, ...manifesto.languages.map((lingua) => lingua.path)]) {
  assert.ok(existsSync(join(radice, percorso)), `manca ${percorso}`);
}

// I fogli di stile non chiamano file che non ci sono.
for (const foglio of manifesto.styles) {
  for (const [, percorso] of leggi(foglio).matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok(existsSync(resolve(radice, dirname(foglio), percorso)), `${foglio} chiama ${percorso}, che manca`);
  }
}

// I modelli che il codice e i modelli stessi chiamano esistono.
const script = elenco("scripts", ".js");
const modelli = elenco("templates", ".hbs");
assert.ok(script.length >= 9 && modelli.length >= 5);
const testi = [...script, ...modelli].map((percorso) => [percorso, leggi(percorso)]);
for (const [percorso, testo] of testi) {
  for (const [, chiamato] of testo.matchAll(/systems\/m6\/(templates\/[\w/-]+\.hbs)/g)) {
    assert.ok(existsSync(join(radice, chiamato)), `${percorso} chiama ${chiamato}, che manca`);
  }
}
for (const nome of ["mago", "png", "parti/tratto", "parti/tiro", "parti/salute"]) assert.ok(modelli.includes(`templates/${nome}.hbs`), `manca il modello ${nome}`);

// La lingua: ogni chiave scritta per intero nel codice o nei modelli esiste.
const lingua = json("lang/it.json");
const parola = (chiave) => chiave.split(".").reduce((dove, pezzo) => dove?.[pezzo], lingua);
const chieste = new Set();
for (const [, testo] of testi) for (const [chiave] of testo.matchAll(/\bM6(?:\.[A-Za-z][\w-]*)+/g)) chieste.add(chiave);
assert.ok(chieste.size > 30);
for (const chiave of chieste) {
  const valore = parola(chiave);
  // Una chiave che finisce su un gruppo è un prefisso: le sue voci si controllano sotto, una per una.
  assert.ok(typeof valore === "string" ? valore.length > 0 : typeof valore === "object" && valore !== null, `manca la parola ${chiave}`);
}
// Le chiavi composte a pezzi: un nome per ogni tratto, campo, segno, stato e scelta.
for (const id of TUTTI_ATTRIBUTI) assert.equal(typeof parola(`M6.Attributi.${id}`), "string", `manca il nome di ${id}`);
for (const id of TUTTE_ABILITA) assert.equal(typeof parola(`M6.Abilita.${id}`), "string", `manca il nome di ${id}`);
for (const id of CAMPI) assert.equal(typeof parola(`M6.Campi.${id}`), "string");
for (const id of SEGNI) assert.equal(typeof parola(`M6.Salute.Segni.${id}`), "string");
for (const id of ["menomato", "ko-fisico", "ko-mentale"]) assert.equal(typeof parola(`M6.Salute.Stati.${id}`), "string");
for (const id of SCELTE) assert.equal(typeof parola(`M6.Telefono.Scelte.${id}`), "string");
for (const tipo of ["mago", "png"]) assert.equal(typeof lingua.TYPES.Actor[tipo], "string");
assert.equal(typeof lingua.TYPES.ChatMessage.tiro, "string");

// E nessuna parola resta nel file senza che qualcuno la chieda.
const tutte = [];
(function scendi(oggetto, prefisso) {
  for (const [chiave, valore] of Object.entries(oggetto)) {
    if (typeof valore === "object") scendi(valore, `${prefisso}${chiave}.`);
    else tutte.push(`${prefisso}${chiave}`);
  }
})(lingua.M6, "M6.");
const prefissi = ["M6.Attributi.", "M6.Abilita.", "M6.Campi.", "M6.Salute.Segni.", "M6.Salute.Stati.", "M6.Telefono.Scelte."];
for (const chiave of tutte) {
  assert.ok(chieste.has(chiave) || prefissi.some((prefisso) => chiave.startsWith(prefisso)), `la parola ${chiave} non la chiede nessuno`);
}

// I segni dei dadi sono al loro posto.
for (const faccia of ["scintilla", "stellina"]) assert.ok(existsSync(join(radice, `assets/dadi/${faccia}.svg`)), `manca il segno ${faccia}`);

// Niente trattino lungo nei testi che si leggono a schermo.
assert.ok(!leggi("lang/it.json").includes(String.fromCharCode(0x2014)), "un trattino lungo nel file di lingua");

console.log("Manifesto: test passati.");
