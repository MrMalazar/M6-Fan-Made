// La finta Foundry (16/9): i pezzi della base che parlano con Foundry
// (`scripts/base/…`) fuori da Foundry non si caricano, e questo gancio li
// rimpiazza coi finti di `stubs/`, uno per file. Si usa con
// `node --import ./tests/finta/register.mjs <prova>`.
const FINTI = ["scheda-base", "pallini", "oggetti", "dadi", "modificatori", "tiro-m6"];

export async function resolve(specifier, context, next) {
  const finto = FINTI.find((nome) => specifier.endsWith(`base/${nome}.js`));
  if (finto) return { url: new URL(`./stubs/${finto}.mjs`, import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
