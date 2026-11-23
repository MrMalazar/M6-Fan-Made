/**
 * I pallini della scheda. Il contenitore dice dove scrivere e quanto vale:
 *
 *   <div class="resource-value" data-value="3" data-name="system.skills.athletics.value">
 *     <span class="resource-value-empty" data-action="dotCounterEmpty"></span>
 *     <span class="resource-value-step" data-action="dotCounterChange" data-index="0"></span> …
 *
 * Un clic su un pallino porta il valore lì; `data-name="items.<id>"` scrive
 * i punti di un oggetto. Con la scheda chiusa dal lucchetto non si scrive.
 */
function bloccata(scheda) {
  const attore = scheda.actor;
  if (!attore?.isOwner) {
    ui.notifications.warn(game.i18n.localize("M6.Comuni.Notifications.NoSufficientPermission"));
    return true;
  }
  if (attore.system?.locked) {
    ui.notifications.warn(game.i18n.format("M6.Comuni.Notifications.CannotModifyResourceString", { string: attore.name }));
    return true;
  }
  return false;
}

async function scrivi(attore, nome, valore) {
  const pezzi = String(nome ?? "").split(".");
  if (pezzi.length === 2 && pezzi[0] === "items") return attore.items.get(pezzi[1])?.update({ "system.points": valore });
  if (!nome) return null;
  return attore.update({ [nome]: valore });
}

export async function _onDotCounterChange(event, target) {
  event.preventDefault();
  const contenitore = target.closest(".resource-value");
  if (!contenitore || bloccata(this)) return;
  return scrivi(this.actor, contenitore.dataset.name, Math.trunc(Number(target.dataset.index) || 0) + 1);
}

export async function _onDotCounterEmpty(event, target) {
  event.preventDefault();
  const contenitore = target.closest(".resource-value");
  if (!contenitore || bloccata(this)) return;
  return scrivi(this.actor, contenitore.dataset.name, 0);
}

/** A ogni disegno: i pallini fino al valore si accendono. */
export function accendiPallini(radice) {
  for (const contenitore of radice?.querySelectorAll?.(".resource-value") ?? []) {
    const valore = Math.trunc(Number(contenitore.dataset.value) || 0);
    contenitore.querySelectorAll(".resource-value-step").forEach((passo, indice) => passo.classList.toggle("active", indice + 1 <= valore));
  }
}
