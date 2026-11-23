import assert from "node:assert/strict";
import { cartaTiro, dadiHtml, innocuo, rigaTiro } from "../scripts/carta.js";
import { leggiTiro } from "../scripts/riserva.js";

const parole = { successo: "Successo", fallimento: "Fallimento", successi: "Successi", soglia: "Soglia", margine: "Margine", mancano: "Mancano", su: "su" };

assert.equal(innocuo(`<b a="1">&'`), "&lt;b a=&quot;1&quot;&gt;&amp;&#x27;");

// I dadi: un riquadro per dado, la faccia come classe, il numero al sorvolo.
{
  const html = dadiHtml(leggiTiro([3, 7, 10], 1));
  assert.equal((html.match(/class="m6-dado /g) ?? []).length, 3);
  assert.match(html, /m6-dado--vuota" title="3"/);
  assert.match(html, /m6-dado--scintilla" title="7"/);
  assert.match(html, /m6-dado--stellina" title="10"/);
  assert.equal(dadiHtml({ risultati: [4], facce: ["<x>"] }), `<span class="m6-dado m6-dado--vuota" title="4"></span>`, "una faccia sconosciuta resta vuota");
  assert.equal(dadiHtml(undefined), "");
}

// La carta riuscita col margine: Successi, Soglia, Margine, e la fascia con una parola in fondo.
{
  const html = cartaTiro({ ...leggiTiro([6, 7, 9, 2], 2), coppia: "Forza + Atletica" }, parole);
  assert.match(html, /^<div class="m6-carta m6-carta--successo">/);
  assert.match(html, /<div class="m6-carta__coppia">Forza \+ Atletica<\/div>/);
  assert.match(html, /<span>Successi<\/span><b>3<\/b>/);
  assert.match(html, /<span>Soglia<\/span><b>2<\/b>/);
  assert.match(html, /<span>Margine<\/span><b>1<\/b>/);
  assert.doesNotMatch(html, /Mancano/);
  assert.match(html, /<div class="m6-carta__fascia">Successo<\/div><\/div>$/, "la fascia chiude la carta");
  assert.ok(html.indexOf("m6-carta__dadi") < html.indexOf("m6-carta__riga"), "prima i dadi, poi il conto");
}

// Riuscita di misura: niente riga del margine.
assert.doesNotMatch(cartaTiro({ ...leggiTiro([6, 7], 2), coppia: "x" }, parole), /Margine/);

// La carta fallita: dice quanti successi mancano.
{
  const html = cartaTiro({ ...leggiTiro([1, 2, 8], 3), coppia: "Fisico" }, parole);
  assert.match(html, /m6-carta--fallimento/);
  assert.match(html, /<span>Mancano<\/span><b>2<\/b>/);
  assert.doesNotMatch(html, /Margine/);
  assert.match(html, /<div class="m6-carta__fascia">Fallimento<\/div>/);
}

// Niente HTML che arriva dai nomi.
assert.doesNotMatch(cartaTiro({ ...leggiTiro([6], 1), coppia: "<img src=x onerror=1>" }, parole), /<img/);

// La riga dell'elenco del telefono: chi, con cosa, i dadi, l'esito col conto.
{
  const html = rigaTiro({ ...leggiTiro([6, 10, 10], 4), chi: "Anna <3", coppia: "Carisma + Convincere" }, parole);
  assert.match(html, /^<li class="m6t-riga m6t-riga--successo">/);
  assert.match(html, /<b>Anna &lt;3<\/b><span>Carisma \+ Convincere<\/span>/);
  assert.match(html, /<b>Successo<\/b><span>5 su 4<\/span>/);
  assert.match(rigaTiro({ ...leggiTiro([1], 2), chi: "Leo", coppia: "Mentale" }, parole), /m6t-riga--fallimento.*<b>Fallimento<\/b><span>0 su 2<\/span>/);
}

console.log("Carta: test passati.");
