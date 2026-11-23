// Un controllo solo: nessun nome usato senza essere dichiarato o importato.
// Gira dentro `npm run check`, su tutto quello che Foundry carica.
import globals from "globals";

const foundry = ["game", "ui", "foundry", "Hooks", "CONFIG", "CONST", "canvas", "Actor", "Item", "ChatMessage", "Roll", "Macro", "JournalEntry", "Folder", "User", "Scene", "Token",
  "TokenDocument", "ActiveEffect", "Combat", "Combatant", "Handlebars", "fromUuid", "fromUuidSync", "getDocumentClass", "$"];

export default [{
  files: ["scripts/**/*.js"],
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    globals: { ...globals.browser, ...Object.fromEntries(foundry.map((nome) => [nome, "readonly"])), module: "readonly" }
  },
  rules: { "no-undef": "error" }
}];
