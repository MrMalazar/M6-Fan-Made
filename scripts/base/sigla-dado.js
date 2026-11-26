/**
 * La sigla di un gruppo di dadi dentro un tiro: `m` per i dadi della riserva,
 * `p` per i rossi, `d` per un dado qualunque (l'iniziativa, un dado tirato a
 * mano). In Foundry la sigla sta sulla classe del dado (`DENOMINATION`):
 * l'oggetto, alla voce `denomination`, dice solo quante facce ha («d10»), ed
 * è uguale per tutti e tre. Un tiro scritto a mano nelle prove porta la sigla
 * in `denomination`, e vale anche quella.
 */
export function siglaDelDado(termine) {
  const dellaClasse = termine?.constructor?.DENOMINATION;
  if (typeof dellaClasse === "string" && dellaClasse) return dellaClasse;
  return String(termine?.denomination ?? "");
}

/** Vero se il gruppo di dadi è della riserva o dei rossi: i dadi di un tiro del gioco. */
export function dadoDelGioco(termine) {
  return ["m", "p"].includes(siglaDelDado(termine));
}
