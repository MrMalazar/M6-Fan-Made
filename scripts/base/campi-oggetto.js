/**
 * I campi della scheda di un oggetto, tipo per tipo. È una tavola: per
 * aggiungere, togliere o spostare un campo si tocca solo questo file, la
 * scheda disegna quello che trova qui.
 *
 * Ogni campo dice dove scrive (`nome`, un percorso del documento), che forma
 * ha (`tipo`) e come si chiama (`etichetta`, una chiave della lingua). Le
 * forme: `scelta` (tendina), `numero`, `testo`, `spunta`, `pallini`, `usi`.
 */

/** Quanto è facile trovare un oggetto, com'è scritto nel catalogo dell'equipaggiamento. */
export const RARITA = Object.freeze(["", "Comune", "Riservata", "Da specialista", "Introvabile", "Militare"]);
export const TIPI_VANTAGGIO = Object.freeze(["background", "merit", "flaw"]);
export const TIPI_ARMA = Object.freeze(["melee", "ranged", "supernatural"]);
/** L'armatura fisica si ripara, la mentale si ricostruisce. */
export const TIPI_ARMATURA = Object.freeze(["fisica", "mentale"]);
/** I tiri su cui un modificatore può pesare. */
export const TIRI = Object.freeze(["physical", "social", "mental"]);

const campo = (nome, tipo, etichetta, altro = {}) => Object.freeze({ nome, tipo, etichetta, ...altro });

const RARITA_CAMPO = campo("flags.m6.rarita", "scelta", "M6.Comuni.Oggetto.Rarita", {
  scelte: RARITA.map((voce) => [voce, voce || "M6.Comuni.Oggetto.SenzaRarita"])
});
const GRADO = campo("flags.m6.grado", "pallini", "M6.Comuni.Oggetto.Grado", { max: 5, nota: "M6.Comuni.Oggetto.GradoNota" });
const QUANTITA = campo("system.quantity", "numero", "M6.Items.Quantity", { min: 0, max: 999 });
const USI = campo("system.uses", "usi", "M6.Comuni.Oggetto.Usi");

export const CAMPI_OGGETTO = Object.freeze({
  feature: Object.freeze([
    campo("system.featuretype", "scelta", "M6.Comuni.Oggetto.Tipo", { scelte: TIPI_VANTAGGIO.map((id) => [id, `M6.Stat.Schede.${id}`]) }),
    campo("system.points", "pallini", "M6.Items.Points", { max: 5, nota: "M6.Items.PointsHint" })
  ]),
  condition: Object.freeze([]),
  weapon: Object.freeze([
    campo("system.weaponType", "scelta", "M6.Items.WeaponType", { scelte: TIPI_ARMA.map((id) => [id, `M6.Items.WeaponTypes.${id}`]) }),
    campo("system.weaponvalue", "numero", "M6.Items.Damage", { min: 0, max: 20, nota: "M6.Items.DamageHint" }),
    campo("flags.m6.aggravato", "spunta", "M6.Items.Aggravated", { nota: "M6.Items.AggravatedHint" }),
    campo("flags.m6.dettagli", "testo", "M6.Comuni.Oggetto.Portata"),
    RARITA_CAMPO,
    GRADO,
    QUANTITA,
    USI
  ]),
  armor: Object.freeze([
    campo("flags.m6.armatura", "scelta", "M6.Items.ArmorKind", { scelte: TIPI_ARMATURA.map((id) => [id, `M6.Items.ArmorKinds.${id}`]) }),
    campo("system.armorvalue", "numero", "M6.Items.ArmorValue", { min: 0, max: 7, nota: "M6.Items.ArmorHint" }),
    campo("flags.m6.armaturaPiena", "numero", "M6.Comuni.Oggetto.ArmaturaPiena", { min: 0, max: 7, nota: "M6.Comuni.Oggetto.ArmaturaPienaNota" }),
    RARITA_CAMPO,
    GRADO,
    QUANTITA
  ]),
  gear: Object.freeze([
    campo("flags.m6.tipo", "testo", "M6.Comuni.Oggetto.Genere"),
    RARITA_CAMPO,
    GRADO,
    QUANTITA,
    USI
  ])
});

/** I tipi di oggetto che portano modificatori ai tiri: per ora le Condizioni. */
export const CON_MODIFICATORI = Object.freeze(["condition"]);

export function campiDi(tipo) {
  return CAMPI_OGGETTO[tipo] ?? [];
}

const leggi = (oggetto, percorso) => String(percorso).split(".").reduce((dove, chiave) => (dove == null ? undefined : dove[chiave]), oggetto);
const intero = (valore, minimo = 0, massimo = Number.MAX_SAFE_INTEGER) => Math.min(Math.max(Math.trunc(Number(valore) || 0), minimo), massimo);

/**
 * I campi di un oggetto coi loro valori, pronti per il disegno. `localize`
 * traduce le chiavi; una scelta che non è una chiave (la rarità) resta com'è.
 */
export function valoriDeiCampi(oggetto, localize = (chiave) => chiave) {
  const dice = (chiave) => (chiave && String(chiave).startsWith("M6.") ? localize(chiave) : String(chiave ?? ""));
  return campiDi(oggetto?.type).map((voce) => {
    const grezzo = leggi(oggetto, voce.nome);
    const riga = { nome: voce.nome, etichetta: dice(voce.etichetta), nota: voce.nota ? dice(voce.nota) : "", [voce.tipo]: true };
    if (voce.tipo === "scelta") {
      const attuale = String(grezzo ?? "");
      const note = voce.scelte.map(([id]) => id);
      // Un valore scritto a mano che la tavola non conosce resta in tendina, così non si perde.
      const scelte = note.includes(attuale) ? voce.scelte : [...voce.scelte, [attuale, attuale]];
      riga.scelte = scelte.map(([id, etichetta]) => ({ id, label: dice(etichetta), selected: id === attuale }));
    } else if (voce.tipo === "numero") {
      riga.valore = intero(grezzo, voce.min ?? 0, voce.max);
      riga.min = voce.min ?? 0;
      riga.max = voce.max ?? "";
    } else if (voce.tipo === "testo") {
      riga.valore = String(grezzo ?? "");
    } else if (voce.tipo === "spunta") {
      riga.valore = grezzo === true || grezzo === "true";
    } else if (voce.tipo === "pallini") {
      riga.valore = intero(grezzo, 0, voce.max ?? 5);
      riga.passi = Array.from({ length: voce.max ?? 5 }, (_, indice) => indice);
    } else if (voce.tipo === "usi") {
      riga.acceso = Boolean(grezzo?.enabled);
      riga.rimasti = intero(grezzo?.current);
      riga.pieni = intero(grezzo?.max);
    }
    return riga;
  });
}

/** Un modificatore nuovo, com'è fatto quelli del catalogo delle Condizioni. */
export function modificatoreNuovo(nome = "") {
  return { source: String(nome ?? ""), value: "-1", paths: ["physical"], displayWhenInactive: false, activeWhen: { check: "always", path: "", value: "" } };
}

/** I modificatori di un oggetto, per il disegno: quanti dadi e su quali tiri. */
export function modificatoriPerLaScheda(bonuses = [], localize = (chiave) => chiave) {
  return (Array.isArray(bonuses) ? bonuses : []).map((voce, indice) => ({
    indice,
    valore: intero(voce?.value, -99, 99),
    tiri: TIRI.map((id) => ({ id, label: localize(`M6.Comuni.Campi.${id}`), acceso: (voce?.paths ?? []).includes(id) || (voce?.paths ?? []).includes("all") }))
  }));
}

/**
 * Dal modulo della scheda ai modificatori da salvare. `righe` è quello che il
 * modulo manda (`{ "0": { value, tiri: { physical: true } } }`), `prima` i
 * modificatori che c'erano: di ognuno si tengono le parti che la scheda non
 * mostra (quando vale, da dove viene).
 */
export function modificatoriDalModulo(righe = {}, prima = [], nome = "") {
  const vecchi = Array.isArray(prima) ? prima : [];
  return Object.keys(righe ?? {})
    .map((chiave) => Number(chiave))
    .filter((indice) => Number.isInteger(indice) && indice >= 0)
    .sort((a, b) => a - b)
    .map((indice) => {
      const riga = righe[indice] ?? {};
      const base = vecchi[indice] ? { ...vecchi[indice] } : modificatoreNuovo(nome);
      const accesi = TIRI.filter((id) => riga.tiri?.[id] === true || riga.tiri?.[id] === "true" || riga.tiri?.[id] === "on");
      return { ...base, value: String(intero(riga.value, -99, 99)), paths: accesi };
    });
}
