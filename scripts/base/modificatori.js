/**
 * I modificatori che gli oggetti di una scheda portano a un tiro: ogni
 * oggetto può dire «−2 dadi sui tiri fisici» nei suoi `bonuses`. Qui si
 * raccolgono quelli che toccano il tiro in corso.
 *
 *   bonus  { source, value, paths: ["physical", …], activeWhen: { check }, displayWhenInactive }
 *
 * Un bonus tocca il tiro se uno dei suoi `paths` è fra i `selectors` del
 * tiro, o se dice «all». È attivo se la sua condizione è «always».
 */
export async function getSituationalModifiers({ actor, selectors = [] } = {}) {
  const cercati = new Set(selectors);
  const trovati = [];
  for (const oggetto of actor?.items ?? []) {
    if (oggetto.system?.suppressed) continue;
    for (const bonus of oggetto.system?.bonuses ?? []) {
      const percorsi = Array.isArray(bonus?.paths) ? bonus.paths : [];
      if (!percorsi.some((percorso) => percorso === "all" || cercati.has(percorso))) continue;
      const attivo = (bonus.activeWhen?.check ?? "always") === "always";
      if (!attivo && !bonus.displayWhenInactive) continue;
      trovati.push({ ...bonus, source: bonus.source || oggetto.name, value: bonus.value, isActive: attivo });
    }
  }
  return trovati;
}
