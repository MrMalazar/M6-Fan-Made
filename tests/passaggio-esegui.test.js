import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GERARCHIA, RACCOLTE, TIPI_OGGETTO } from "../scripts/passaggio/regole.js";
import { applicaAggiornamento, mondoDelModulo } from "./passaggio-mondo.mjs";

/**
 * Una Foundry finta per il passaggio: un mondo del modulo aperto col sistema,
 * con le schede chiuse. Fa quello che fa Foundry 14 (visto dal vivo, 14.368):
 *
 *   - scrive l'aggiornamento di una scheda chiusa e poi inciampa nel
 *     mostrarla; alla ricarica apre le schede che hanno un tipo del sistema;
 *   - rifiuta in silenzio (torna a mani vuote, non scrive niente) un ritocco
 *     al delta di un segnalino non legato se la scheda sotto non è intera o
 *     se il delta porta un oggetto che il sistema non conosce;
 *   - si ferma con un errore, dopo aver scritto, quando si svuota una scheda
 *     e un suo segnalino non legato porta nel delta un oggetto sconosciuto;
 *   - non sa togliere dal delta un oggetto sconosciuto: il delta si cancella
 *     intero, e si riscrive.
 */
const CHIAVI = { actors: (fonte) => ["mago", "png"].includes(fonte.type), items: (fonte) => TIPI_OGGETTO.includes(fonte.type) };

function monta(mondo) {
  const registro = { aggiornati: [], tolti: [], mazzi: [], delta: [], rifiuti: [], avvisi: [], diari: [], finestre: [], ricariche: 0, errore: null, muto: null };
  const archivio = new Map(mondo.impostazioni.map((voce) => [voce.key, voce]));

  /** Un oggetto che il sistema non conosce (le lapidi non contano). */
  const sconosciuto = (oggetto) => Boolean(oggetto) && !oggetto._tombstone && !TIPI_OGGETTO.includes(oggetto.type);
  /** La scheda sotto un segnalino è intera: aperta, e senza oggetti sconosciuti. */
  const schedaIntera = (id) => {
    const scheda = mondo.raccolte.actors.find((riga) => riga.fonte._id === id);
    return Boolean(scheda) && !scheda.invalido && !scheda.fonte.items.some(sconosciuto);
  };
  /** Il ritocco al delta di un segnalino che Foundry lascia cadere. */
  const deltaRifiutato = (scena, cambio) => {
    if (!Object.hasOwn(cambio, "delta")) return false;
    const segnalino = scena.tokens.find((riga) => riga._id === cambio._id);
    return Boolean(segnalino.actorLink) || !schedaIntera(segnalino.actorId) || (segnalino.delta?.items ?? []).some(sconosciuto);
  };

  function documento(raccolta, nome, voce) {
    const doc = {
      get _source() { return voce.fonte; },
      get id() { return voce.fonte._id; },
      get name() { return voce.fonte.name; },
      async update(cambia) {
        if (registro.errore?.(voce.fonte)) throw new Error("il server non accetta");
        if (registro.muto?.(voce.fonte) || (nome === "Scene" && (cambia.tokens ?? []).some((cambio) => deltaRifiutato(voce.fonte, cambio)))) {
          registro.rifiuti.push(`${nome}:${voce.fonte.name}`);
          return undefined;
        }
        voce.fonte = applicaAggiornamento(GERARCHIA, nome, voce.fonte, cambia);
        registro.aggiornati.push(`${nome}:${voce.fonte.name}`);
        if (voce.invalido) throw new TypeError("Cannot read properties of undefined (reading '_source')");
        return doc;
      },
      async deleteEmbeddedDocuments(tipo, ids) {
        assert.equal(voce.invalido, false, "una scheda chiusa non si svuota");
        assert.equal(tipo, "Item");
        voce.fonte = { ...voce.fonte, items: voce.fonte.items.filter((oggetto) => !ids.includes(oggetto._id)) };
        registro.tolti.push(`${voce.fonte.name}:${ids.length}`);
        // Foundry rifà i segnalini non legati della scheda, e su un delta con un oggetto sconosciuto si ferma.
        const segnalini = mondo.raccolte.scenes.flatMap((scena) => scena.fonte.tokens ?? []);
        if (segnalini.some((riga) => riga.actorId === voce.fonte._id && !riga.actorLink && (riga.delta?.items ?? []).some(sconosciuto))) throw new Error("validation errors: items: type is not a valid type");
      },
      async updateEmbeddedDocuments(tipo, cambi) {
        assert.equal(nome, "Scene");
        assert.equal(tipo, "Token");
        if (registro.muto?.(voce.fonte) || cambi.some((cambio) => deltaRifiutato(voce.fonte, cambio))) {
          registro.rifiuti.push(`Token:${cambi.map((cambio) => cambio._id).join(",")}`);
          return [];
        }
        const fatti = [];
        for (const { _id, ...cambio } of cambi) {
          const posto = voce.fonte.tokens.findIndex((riga) => riga._id === _id);
          let segnalino = voce.fonte.tokens[posto];
          // Da un delta azzerato a uno nuovo: si scrive intero.
          if (cambio.delta && !segnalino.delta) {
            segnalino = { ...segnalino, delta: structuredClone(cambio.delta) };
            delete cambio.delta;
            registro.delta.push(`scrive ${segnalino.name}`);
          }
          voce.fonte.tokens[posto] = applicaAggiornamento(GERARCHIA, "Token", segnalino, cambio);
          fatti.push({ id: _id });
        }
        return fatti;
      },
      tokens: {
        get(id) {
          if (!voce.fonte.tokens?.some((riga) => riga._id === id)) return undefined;
          const fonte = () => voce.fonte.tokens.find((riga) => riga._id === id);
          return {
            get _source() { return fonte(); },
            // Il delta si tocca dal suo documento: dalla scheda che il segnalino mostra Foundry non toglie davvero.
            get actor() { throw new Error("il delta non si tocca dalla scheda del segnalino"); },
            delta: {
              async delete() {
                fonte().delta = null;
                registro.delta.push(`azzera ${fonte().name}`);
              },
              async deleteEmbeddedDocuments() { throw new Error("un oggetto sconosciuto non si toglie dal delta: sul server resta"); }
            }
          };
        }
      }
    };
    return doc;
  }

  function raccolta(nome, voci) {
    const documenti = new Map(voci.map((voce) => [voce.fonte._id, documento(nome, RACCOLTE[nome] ?? nome, voce)]));
    return {
      get contents() { return voci.filter((voce) => !voce.invalido).map((voce) => documenti.get(voce.fonte._id)); },
      get invalidDocumentIds() { return new Set(voci.filter((voce) => voce.invalido).map((voce) => voce.fonte._id)); },
      get: (id) => (voci.find((voce) => voce.fonte._id === id && !voce.invalido) ? documenti.get(id) : undefined),
      getInvalid: (id) => documenti.get(id)
    };
  }

  const game = {
    system: { id: "m6" },
    user: { id: "gm", isGM: true },
    i18n: { localize: (chiave) => chiave, format: (chiave, dati) => `${chiave} ${JSON.stringify(dati ?? {})}` },
    packs: [],
    settings: {
      settings: new Map(mondo.registrate.map((chiave) => [chiave, {}])),
      storage: { get: () => Object.assign([...archivio.values()].map((voce) => ({ ...voce, delete: async () => archivio.delete(voce.key) })), { get(id) { return this.find((voce) => voce.id === id); } }) },
      register: (ambito, chiave) => game.settings.settings.set(`${ambito}.${chiave}`, {}),
      get: (ambito, chiave) => archivio.get(`${ambito}.${chiave}`)?.value ?? {},
      set: async (ambito, chiave, valore) => { archivio.set(`${ambito}.${chiave}`, { id: `nuova-${chiave}`, key: `${ambito}.${chiave}`, value: structuredClone(valore) }); }
    }
  };
  for (const nome of Object.keys(RACCOLTE)) game[nome] = raccolta(nome, mondo.raccolte[nome] ?? []);
  game.users.activeGM = { id: "gm" };
  const pacchi = mondo.pacchi.map((pacco) => Object.assign(raccolta(pacco.documento === "Item" ? "items" : "altro", pacco.voci), { collection: pacco.id, documentName: pacco.documento, metadata: { packageType: "world" }, locked: false, getDocuments: async () => [] }));
  game.packs = Object.assign(pacchi, { get: (id) => pacchi.find((pacco) => pacco.collection === id) });

  globalThis.game = game;
  globalThis.getDocumentClass = (nome) => ({
    async updateDocuments(aggiornamenti, opzioni = {}) {
      registro.mazzi.push(`${nome}${opzioni.pack ? `@${opzioni.pack}` : ""}:${aggiornamenti.length}`);
      const dove = opzioni.pack ? game.packs.get(opzioni.pack) : Object.entries(RACCOLTE).map(([chiave, documentoNome]) => (documentoNome === nome ? game[chiave] : null)).find(Boolean);
      const fatti = [];
      for (const { _id, ...cambia } of aggiornamenti) {
        const fatto = await dove.get(_id).update(cambia);
        if (fatto) fatti.push(fatto);
      }
      return fatti;
    }
  });
  globalThis.JournalEntry = { create: async (dati) => { registro.diari.push(dati); return { name: dati.name }; } };
  globalThis.ui = { notifications: { info: (testo) => { registro.avvisi.push(testo); return { update: () => {} }; }, warn: (testo) => registro.avvisi.push(testo), error: (testo) => registro.avvisi.push(`ERRORE ${testo}`) } };
  globalThis.foundry = { utils: { getRoute: (percorso) => `/${percorso}`, escapeHTML: (testo) => String(testo) }, applications: { api: { DialogV2: { wait: async (opzioni) => { registro.finestre.push(opzioni); return registro.risposta ?? null; } } } } };
  globalThis.fetch = async (percorso) => ({ ok: !percorso.includes("manca") });

  /** Quello che fa la ricarica della pagina: le schede che adesso hanno un tipo del sistema si aprono. */
  function ricarica() {
    registro.ricariche += 1;
    for (const [nome, valida] of Object.entries(CHIAVI)) for (const voce of mondo.raccolte[nome]) voce.invalido = !valida(voce.fonte);
  }
  return { game, registro, archivio, ricarica };
}

const mondo = mondoDelModulo();
const { game, registro, archivio, ricarica } = monta(mondo);
const { apri, applica, esamina, fotografa, haTracce, leggiStato, passaggioAlPronto, porta, registraPassaggio, PASSAGGIO_SETTING } = await import("../scripts/passaggio/esegui.js");

registraPassaggio(game);
assert.ok(game.settings.settings.has(`m6.${PASSAGGIO_SETTING}`));
assert.equal(haTracce(game), true);

// La fotografia: tutte le raccolte, le schede chiuse segnate, le impostazioni lette.
{
  const foto = await fotografa(game);
  assert.deepEqual(Object.keys(foto.raccolte), Object.keys(RACCOLTE));
  assert.deepEqual(foto.raccolte.actors.map((voce) => voce.invalido), [true, true, true, true, true]);
  assert.equal(foto.pacchi[0].id, "world.grimorio-comune");
  assert.ok(foto.registrate.includes("m6.passaggio"));
  assert.ok(foto.impostazioni.some((voce) => voce.key === "wod5e-mage.guidaTesti"));
}

// L'esame non scrive niente.
{
  const piano = await esamina({ gioco: game });
  assert.equal(piano.daFare, true);
  assert.deepEqual([registro.aggiornati.length, registro.tolti.length, registro.mazzi.length], [0, 0, 0]);
}

// ------------------------------------------------------------ il primo giro
const primo = await porta({ gioco: game });
assert.deepEqual([primo.finito, primo.ricarica, primo.giro], [false, true, 1]);
assert.deepEqual(registro.aggiornati.slice(0, 4), ["Actor:Ada", "Actor:Sgherro", "Actor:Via - Nome", "Actor:Anziano"], "le schede chiuse per prime, una per volta");
assert.deepEqual(registro.mazzi, ["Item:1", "ChatMessage:3", "JournalEntry:1", "Macro:2", "User:1", "Item@world.grimorio-comune:1"]);
assert.deepEqual(registro.tolti, [], "a schede chiuse non si toglie niente");
assert.deepEqual(primo.errori, []);
{
  const stato = leggiStato(game);
  assert.deepEqual([stato.inCorso, stato.giro], [true, 1]);
  assert.equal(stato.rapporto.portati.length, 4);
  assert.ok(stato.percorsi.includes("systems/m6/assets/icons/sheet/forces.png"));
  assert.ok(archivio.has("wod5e-mage.guidaTesti"), "le impostazioni passano solo alla fine");
  assert.equal(registro.diari.length, 0);
}

// ----------------------------------------------------------- il secondo giro
ricarica();
registro.aggiornati.length = 0;
registro.mazzi.length = 0;
const secondo = await porta({ gioco: game });
assert.deepEqual([secondo.finito, secondo.ricarica, secondo.giro], [false, true, 2]);
// Davanti alle schede il delta da rifare: la copia al sicuro (l'aggiornamento della scena) e il delta azzerato.
// Poi le schede, prima il togliere e poi l'aggiornare. Poi, nello stesso giro, il seguito: a schede intere la
// scena passa e il delta si riscrive dalla copia.
assert.deepEqual(registro.aggiornati, ["Scene:Il porto", "Actor:Ada", "Actor:Via - Nome", "Actor:Anziano", "Scene:Il porto"]);
assert.deepEqual(registro.tolti, ["Ada:2", "Via - Nome:3", "Anziano:1"]);
assert.deepEqual(registro.delta, ["azzera Via - Nome", "scrive Via - Nome"]);
assert.deepEqual(registro.rifiuti, [], "niente è stato chiesto a Foundry nel momento sbagliato");
assert.deepEqual(secondo.errori, []);
assert.ok(archivio.has("wod5e-mage.guidaTesti"), "le impostazioni aspettano ancora");

// ------------------------------------------------- la fine, a pagina fresca
ricarica();
registro.aggiornati.length = 0;
registro.tolti.length = 0;
const fine = await porta({ gioco: game });
assert.deepEqual([fine.finito, fine.ricarica, fine.fermo], [true, false, false]);
assert.deepEqual([registro.aggiornati, registro.tolti], [[], []], "l'ultimo giro è solo un esame: non trova più niente");
assert.deepEqual(fine.errori, []);
// Le impostazioni del modulo sono passate, e le vecchie non ci sono più; quelle che il sistema non conosce restano.
assert.deepEqual(archivio.get("m6.paradossoNarratore").value, { points: 16, visible: false, log: [{ kind: "given", amount: 6 }] });
assert.equal(archivio.get("m6.condizioniVersione").value, "2026-09-29");
assert.equal(archivio.get("m6.guidaTesti").value.controllo.perche, "<p class=\"m6-guidata-lead\">Il memo.</p>");
assert.ok(!archivio.has("wod5e-mage.paradossoNarratore") && !archivio.has("wod5e-mage.guidaTesti"));
assert.ok(archivio.has("wod5e-mage.nonPiuUsata") && archivio.has("wod5e.worldVersion"));
assert.deepEqual(Object.keys(archivio.get("core.compendiumConfiguration").value), ["wod5e.macros", "m6.mage-pregi", "world.grimorio-comune"]);
// Il rapporto: nel diario, con tutti i giri dentro e ogni cosa detta una volta.
assert.equal(registro.diari.length, 1);
const pagina = registro.diari[0].pages[0].text.content;
for (const parola of ["Ada", "Sgherro", "Via - Nome", "Anziano", "Il gruppo", "Mano fasciata", "Mischia (armi) 2", "Guardia del corpo (6)", "Dominazione", "Scorta (4)", "wod5e-mage.nonPiuUsata"]) assert.ok(pagina.includes(parola), `nel rapporto c'è ${parola}`);
assert.equal(pagina.split("Mano fasciata").length, 2, "una volta sola");
assert.ok(!pagina.includes("M6.Passaggio.Sezioni.Errori"), "senza errori la sezione non c'è");
assert.ok(!pagina.includes("M6.Passaggio.Sezioni.Rimasti"));
assert.ok(!pagina.includes("M6.Passaggio.Sezioni.Mancanti"));
// I testi rimasti fuori dalle schede hanno la loro pagina.
assert.equal(registro.diari[0].pages.length, 2);
assert.ok(registro.diari[0].pages[1].text.content.includes("Scritta sulla scheda di wod5e."));
{
  const stato = leggiStato(game);
  assert.deepEqual([stato.inCorso, stato.giro, stato.fermo], [false, 0, false]);
  assert.equal(stato.diario, registro.diari[0].name);
}

// ------------------------------------------------------------ a mondo passato
{
  const piano = await esamina({ gioco: game });
  assert.equal(piano.daFare, false);
  assert.equal(haTracce(game), true, "resta l'impostazione che il sistema non conosce: il segno veloce scatta ancora…");
  registro.finestre.length = 0;
  await passaggioAlPronto(game);
  assert.equal(registro.finestre.length, 0, "…ma l'esame dice che non c'è niente da fare, e nessuna finestra si apre");
  const ada = mondo.raccolte.actors[0].fonte;
  assert.equal(ada.type, "mago");
  assert.deepEqual(ada.items.map((voce) => voce.name), ["Fortunato", "Scosso", "Di cattivo umore", "Pistola"]);
  assert.equal(ada.flags.m6.passaggio.daTogliere, undefined);
  const segnalino = mondo.raccolte.scenes[0].fonte.tokens[1];
  assert.deepEqual(segnalino.delta.items.map((voce) => voce.name ?? "lapide"), ["Ferito", "lapide"]);
  assert.equal(segnalino.delta.flags.m6.nemico.casi.tratto_ogg0000000000042.nome, "Scorta", "il caso nato dal tratto del segnalino è nel delta nuovo");
  assert.deepEqual(segnalino.flags, { m6: { nota: "sul segnalino" } }, "la copia è sparita");
  assert.deepEqual([segnalino.bar1.attribute, segnalino.bar2.attribute], ["salute", null]);
}

// --------------------------------------------- la finestra e la ripresa
{
  const altro = mondoDelModulo();
  const finto = monta(altro);
  registraPassaggio(finto.game);
  // All'avvio il Narratore trova la finestra; «più tardi» non tocca niente.
  await passaggioAlPronto(finto.game);
  assert.equal(finto.registro.finestre.length, 1);
  assert.ok(finto.registro.finestre[0].content.includes("M6.Passaggio.Copia"));
  assert.deepEqual(finto.registro.finestre[0].buttons.map((tasto) => tasto.action), ["porta", "dopo"]);
  assert.equal(finto.registro.aggiornati.length, 0);
  // Un giocatore, o un secondo Narratore, non vede niente.
  finto.game.user.isGM = false;
  await passaggioAlPronto(finto.game);
  assert.equal(finto.registro.finestre.length, 1);
  finto.game.user.isGM = true;
  // Un passaggio rimasto a metà riprende da solo all'avvio dopo.
  const originale = globalThis.setTimeout;
  globalThis.setTimeout = (funzione) => { finto.registro.ricariche += 1; return 0; };
  globalThis.location = { reload: () => {} };
  try {
    finto.registro.risposta = "porta";
    await apri({ gioco: finto.game });
    assert.equal(leggiStato(finto.game).inCorso, true);
    assert.equal(finto.registro.ricariche, 1, "dopo il primo giro la pagina si ricarica");
    finto.ricarica();
    finto.registro.finestre.length = 0;
    await passaggioAlPronto(finto.game);
    assert.equal(leggiStato(finto.game).inCorso, true, "dopo il secondo giro si ricarica ancora, per guardare a pagina fresca");
    assert.equal(finto.registro.finestre.length, 0);
    finto.ricarica();
    await passaggioAlPronto(finto.game);
    assert.equal(leggiStato(finto.game).inCorso, false);
    assert.equal(finto.registro.finestre.length, 1, "alla fine si apre il rapporto");
    assert.ok(finto.registro.finestre[0].content.includes("Mano fasciata"));
    assert.ok(finto.registro.finestre[0].content.includes("M6.Passaggio.Finito"));
  } finally {
    globalThis.setTimeout = originale;
  }
}

// ------------------------------------------- quando qualcosa non si lascia portare
{
  const altro = mondoDelModulo();
  const finto = monta(altro);
  registraPassaggio(finto.game);
  // Il server rifiuta una scheda: l'errore finisce nel rapporto, le altre passano.
  finto.registro.errore = (fonte) => fonte.name === "Anziano";
  const uno = await porta({ gioco: finto.game });
  assert.deepEqual(uno.errori, [{ nome: "Anziano", documento: "Actor", errore: "il server non accetta" }]);
  finto.ricarica();
  // La scheda resta chiusa: i giri continuano finché non sono troppi, poi il passaggio si ferma e lo dice.
  let ultimo = uno;
  let giri = 1;
  for (; giri < 8 && !ultimo.finito; giri += 1) {
    ultimo = await porta({ gioco: finto.game });
    finto.ricarica();
  }
  assert.equal(ultimo.finito, true);
  assert.equal(ultimo.fermo, true);
  assert.equal(giri, 5, "quattro giri di lavoro, poi quello che si ferma");
  assert.deepEqual(ultimo.errori, [{ nome: "Anziano", documento: "Actor", errore: "il server non accetta" }], "gli errori dell'ultimo giro, non di tutti");
  const fermata = finto.registro.diari[0].pages[0].text.content;
  assert.ok(fermata.includes("il server non accetta"));
  assert.ok(fermata.includes("M6.Passaggio.Sezioni.Rimasti"));
  assert.equal(altro.raccolte.actors[3].fonte.type, "vampire", "la scheda rifiutata è rimasta com'era");
  assert.equal(altro.raccolte.actors[0].fonte.type, "mago");
  assert.equal(leggiStato(finto.game).fermo, true);
}

// ------------------------------------------- quando Foundry lascia cadere un cambio
{
  // Un documento che Foundry non accetta e non lo dice: il silenzio diventa un errore col suo nome.
  const altro = mondoDelModulo();
  const finto = monta(altro);
  registraPassaggio(finto.game);
  finto.registro.muto = (fonte) => fonte.name === "Appunti";
  const uno = await porta({ gioco: finto.game });
  assert.deepEqual(uno.errori, [{ nome: "Appunti", documento: "JournalEntry", errore: "M6.Passaggio.Rifiuto" }]);
  assert.deepEqual(finto.registro.rifiuti, ["JournalEntry:Appunti"]);
  finto.registro.muto = null;

  // Un rifacimento interrotto a metà: la scena non accetta il delta nuovo. Il delta vecchio è già azzerato,
  // ma quello nuovo è al sicuro nelle bandiere del segnalino, e il giro dopo riprende da lì.
  finto.ricarica();
  finto.registro.muto = (fonte) => fonte.name === "Il porto" && fonte.tokens[1].delta === null;
  const due = await porta({ gioco: finto.game });
  assert.deepEqual(due.errori, [{ nome: "Il porto", documento: "Scene", errore: "M6.Passaggio.Rifiuto" }]);
  const aMeta = altro.raccolte.scenes[0].fonte.tokens[1];
  assert.equal(aMeta.delta, null);
  assert.equal(aMeta.flags.m6.passaggio.delta.flags.m6.nemico.casi.tratto_ogg0000000000042.nome, "Scorta");
  finto.registro.muto = null;
  finto.ricarica();
  finto.registro.delta.length = 0;
  const tre = await porta({ gioco: finto.game });
  assert.deepEqual([tre.finito, tre.errori], [false, []]);
  assert.deepEqual(finto.registro.delta, ["scrive Via - Nome"], "il delta non si azzera due volte: si riscrive dalla copia");
  const rifatto = altro.raccolte.scenes[0].fonte.tokens[1];
  assert.deepEqual(rifatto.delta.items.map((voce) => voce.name ?? "lapide"), ["Ferito", "lapide"]);
  assert.deepEqual(rifatto.flags, { m6: { nota: "sul segnalino" } });
  finto.ricarica();
  const quattro = await porta({ gioco: finto.game });
  assert.deepEqual([quattro.finito, quattro.fermo, quattro.errori], [true, false, []]);
}

// ------------------------------------------------ l'esame dal mondo del modulo
{
  // Il mondo gira ancora col modulo: Foundry dà le schede per aperte e non ha caricato le parole del sistema.
  // La finestra le legge dal file di lingua, mostra i conti e non scrive niente.
  const vecchio = mondoDelModulo();
  for (const voce of [...vecchio.raccolte.actors, ...vecchio.raccolte.items]) voce.invalido = false;
  const finto = monta(vecchio);
  finto.game.system.id = "wod5e";
  const lingua = JSON.parse(readFileSync(new URL("../lang/it.json", import.meta.url), "utf8"));
  const chiesti = [];
  globalThis.fetch = async (percorso) => {
    chiesti.push(percorso);
    return { ok: !percorso.includes("manca"), json: async () => lingua };
  };
  const piano = await apri({ gioco: finto.game });
  assert.equal(piano.daFare, true);
  assert.ok(chiesti.includes("/systems/m6/lang/it.json"));
  assert.equal(finto.registro.finestre.length, 1);
  const finestra = finto.registro.finestre[0];
  assert.equal(finestra.window.title, "Passaggio dal modulo");
  assert.ok(finestra.content.includes("Qui non si scrive niente."));
  assert.ok(finestra.content.includes("Abilità da travasare a mano") && finestra.content.includes("Mano fasciata"));
  assert.ok(!finestra.content.includes("M6.Passaggio."), "nessuna chiave nuda");
  assert.deepEqual(finestra.buttons.map((tasto) => tasto.action), ["chiudi"], "si può solo chiudere");
  assert.deepEqual([finto.registro.aggiornati.length, finto.registro.mazzi.length, finto.registro.delta.length], [0, 0, 0]);
  assert.equal(vecchio.raccolte.actors[0].fonte.type, "mortal");
}

// Chi non è il Narratore non porta niente.
{
  const finto = monta(mondoDelModulo());
  finto.game.user.isGM = false;
  await assert.rejects(() => porta({ gioco: finto.game }), /SoloNarratore/);
}

// Il codice è al suo posto: registrato all'avvio, aperto al pronto, offerto come porta.
const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
assert.match(main, /registraPassaggio\(\);/);
assert.match(main, /passaggioAlPronto\(\)/);
assert.match(main, /\n    passaggio\n/);
assert.equal(typeof applica, "function");

console.log("Passaggio, l'esecuzione: prove passate.");
