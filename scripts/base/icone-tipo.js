/**
 * L'icona di un oggetto dal suo genere, quando non ne ha una sua. Sono le
 * icone di serie di Foundry: un'arma da mischia ha la spada, una a distanza
 * il bersaglio, l'armatura fisica lo scudo, la mentale lo scudo del mago. Il
 * resto tiene la sacca. La stessa tavola sta in tools/build-equipaggiamento.py,
 * che genera il catalogo.
 */
export const ICONA_GENERICA = "icons/svg/item-bag.svg";

export const ICONE_DEL_TIPO = Object.freeze({
  mischia: "icons/svg/sword.svg",
  distanza: "icons/svg/target.svg",
  fisica: "icons/svg/shield.svg",
  mentale: "icons/svg/mage-shield.svg"
});

export function iconaDelTipo(tipo, dati = {}) {
  if (tipo === "weapon") return dati.system?.weaponType === "ranged" ? ICONE_DEL_TIPO.distanza : ICONE_DEL_TIPO.mischia;
  if (tipo === "armor") return dati.flags?.m6?.armatura === "mentale" ? ICONE_DEL_TIPO.mentale : ICONE_DEL_TIPO.fisica;
  return ICONA_GENERICA;
}

/** Vero se l'oggetto nasce senza un'immagine sua: vuota, o la sacca di Foundry. */
export function senzaIcona(img) {
  const percorso = String(img ?? "").trim().replace(/^\/+/, "");
  return !percorso || percorso === ICONA_GENERICA;
}

/** Alla nascita di un'arma o di un'armatura senza immagine, le dà quella del suo genere. */
export function registraIconeDelTipo() {
  Hooks.on("preCreateItem", (oggetto, dati) => {
    if (!["weapon", "armor"].includes(oggetto.type) || !senzaIcona(dati?.img)) return;
    oggetto.updateSource({ img: iconaDelTipo(oggetto.type, { system: oggetto.system, flags: oggetto.flags }) });
  });
}
