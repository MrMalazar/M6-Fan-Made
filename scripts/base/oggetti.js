/**
 * I gesti sugli oggetti di una scheda: crearne uno, mandarlo in chat,
 * toglierlo, spendere e ridare gli usi. Ogni tasto dice l'oggetto con
 * `data-item-id` (o `data-item-uuid`), su di sé o su un elemento che lo contiene.
 */
function oggettoDi(scheda, target) {
  const riga = target?.closest?.("[data-item-id], [data-item-uuid]") ?? target;
  const id = riga?.dataset?.itemId;
  if (id) return scheda.actor.items.get(id) ?? null;
  const uuid = riga?.dataset?.itemUuid;
  return uuid ? (scheda.actor.items.find((oggetto) => oggetto.uuid === uuid) ?? null) : null;
}

/** Il + che crea da zero: un oggetto del tipo chiesto, e si apre la sua scheda. */
export async function _onCreateItem(event, target) {
  event?.preventDefault?.();
  const tipo = String(target?.dataset?.type ?? "");
  if (!tipo || !CONFIG.Item.dataModels?.[tipo]) return null;
  const sottotipo = String(target?.dataset?.subtype ?? "");
  const nome = game.i18n.format("M6.Comuni.NuovoOggetto", { tipo: game.i18n.localize(`TYPES.Item.${tipo}`) });
  const system = tipo === "feature" && sottotipo ? { featuretype: sottotipo } : {};
  const [oggetto] = await this.actor.createEmbeddedDocuments("Item", [{ name: nome, type: tipo, system }]);
  oggetto?.sheet?.render(true);
  return oggetto ?? null;
}

/** Il cestino: chiede conferma, poi toglie. */
export async function _onItemDelete(event, target) {
  event?.preventDefault?.();
  const oggetto = oggettoDi(this, target);
  if (!oggetto) return;
  const conferma = await foundry.applications.api.DialogV2.confirm({
    window: { title: game.i18n.localize("M6.Comuni.Delete") },
    content: `<p>${game.i18n.format("M6.Comuni.ConfermaElimina", { nome: foundry.utils.escapeHTML(oggetto.name) })}</p>`
  });
  if (conferma) await oggetto.delete();
}

/** L'oggetto in chat: nome, immagine e descrizione. */
export async function _onItemChat(event, target) {
  event?.preventDefault?.();
  const oggetto = oggettoDi(this, target);
  if (!oggetto) return;
  const descrizione = await foundry.applications.ux.TextEditor.implementation.enrichHTML(String(oggetto.system?.description ?? ""));
  const immagine = oggetto.img ? `<img src="${foundry.utils.escapeHTML(oggetto.img)}" alt="" width="36" height="36">` : "";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    content: `<div class="m6-oggetto-chat"><h3>${immagine}${foundry.utils.escapeHTML(oggetto.name)}</h3>${descrizione}</div>`
  });
}

/** Un uso speso: mai sotto zero. */
export async function _onExpendItemUse(event, target) {
  event?.preventDefault?.();
  const oggetto = oggettoDi(this, target);
  const usi = oggetto?.system?.uses;
  if (!usi?.enabled) return;
  await oggetto.update({ "system.uses.current": Math.max(Math.trunc(Number(usi.current) || 0) - 1, 0) });
}

/** Gli usi tornano pieni. */
export async function _onRestoreItemUses(event, target) {
  event?.preventDefault?.();
  const oggetto = oggettoDi(this, target);
  const usi = oggetto?.system?.uses;
  if (!usi?.enabled) return;
  await oggetto.update({ "system.uses.current": Math.max(Math.trunc(Number(usi.max) || 0), 0) });
}

/** La lente: apre i compendi che tengono oggetti di quel tipo. */
export async function _onSearchItem(event, target) {
  event?.preventDefault?.();
  const tipo = String(target?.dataset?.type ?? "");
  const sottotipo = String(target?.dataset?.subtype ?? "");
  const adatti = game.packs.filter((pack) => pack.documentName === "Item" && pack.index.some((voce) => voce.type === tipo
    && (!sottotipo || !voce.system?.featuretype || voce.system.featuretype === sottotipo)));
  if (!adatti.length) return ui.notifications.info(game.i18n.localize("M6.Comuni.NessunCompendio"));
  for (const pack of adatti) pack.render(true);
}

/** Il lucchetto: chiude e riapre la scheda alle modifiche. */
export async function _onToggleLock(event) {
  event?.preventDefault?.();
  if (!this.actor.isOwner) return;
  await this.actor.update({ "system.locked": !this.actor.system.locked });
}

/** Gli oggetti di una scheda per gruppi: `{ gruppo: [oggetti] }`, nell'ordine dato e coi gruppi vuoti presenti. */
export function perGruppi(oggetti, gruppi, gruppoDi) {
  const esito = Object.fromEntries(gruppi.map((gruppo) => [gruppo, []]));
  for (const oggetto of oggetti) {
    const gruppo = gruppoDi(oggetto);
    if (gruppo in esito) esito[gruppo].push(oggetto);
  }
  for (const lista of Object.values(esito)) lista.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, game.i18n.lang));
  return esito;
}
