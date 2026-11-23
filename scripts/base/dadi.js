/**
 * I dadi di M6 per Foundry: il dado della riserva e la base dei dadi
 * speciali. Tutti a dieci facce; cosa vale una faccia lo dice il motore
 * delle regole (sistema.js), non il dado.
 */
const { Die } = foundry.dice.terms;

/** Un dado a dieci facce con una lettera sua nella formula. */
export class DadoM6 extends Die {
  constructor(termData = {}) {
    super({ ...termData, faces: 10 });
  }

  /** @override */
  static DENOMINATION = "w";
}

/** Il dado della riserva: «7dm». */
export class DadoRiserva extends DadoM6 {
  /** @override */
  static DENOMINATION = "m";
}

/** Dove i dadi speciali lasciano le loro facce per la carta in chat. */
export const RegistroDadi = {
  speciali: new Map(),
  registerAdvanced(linea, dati) {
    this.speciali.set(linea, dati);
  }
};

/** Foundry impara la lettera del dado della riserva. */
export function registraDadi() {
  CONFIG.Dice.terms[DadoRiserva.DENOMINATION] = DadoRiserva;
  // Chi ha i dadi in 3D (il modulo Dice So Nice) vede le facce di M6.
  Hooks.once("diceSoNiceReady", dadiRiserva3D);
}

const DADI_3D = "m6";
const FACCE_3D = "systems/m6/assets/icons/dice/dsn";
const gia3D = new WeakSet();

/** Il sistema di dadi di M6 dentro Dice So Nice: si dichiara una volta, poi se ne usa la sigla. */
export function sistemaDadi3D(dice3d) {
  if (!gia3D.has(dice3d)) {
    gia3D.add(dice3d);
    dice3d.addSystem({ id: DADI_3D, name: game.i18n.localize("M6.Comuni.Dadi3D.Categoria") }, "preferred");
  }
  return DADI_3D;
}

/** Il dado della riserva in 3D: vuoto da 1 a 5, la scintilla da 6 a 9, la stellina sul 10. */
function dadiRiserva3D(dice3d) {
  const sistema = sistemaDadi3D(dice3d);
  const vuota = `${FACCE_3D}/vuota.png`;
  const scintilla = `${FACCE_3D}/riserva-scintilla.png`;
  dice3d.addColorset({
    name: "mage-riserva",
    description: "M6.Comuni.Dadi3D.Riserva",
    category: "M6.Comuni.Dadi3D.Categoria",
    foreground: "#d9c28a",
    background: "#2f2153",
    edge: "#b58ade",
    texture: "none",
    material: "plastic",
    font: "Arial Black"
  }, "default");
  dice3d.addDicePreset({
    type: `d${DadoRiserva.DENOMINATION}`,
    labels: [vuota, vuota, vuota, vuota, vuota, scintilla, scintilla, scintilla, scintilla, `${FACCE_3D}/riserva-stellina.png`],
    colorset: "mage-riserva",
    system: sistema
  }, "d10");
}
