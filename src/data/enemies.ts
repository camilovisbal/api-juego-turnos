import type { CharacterClass } from "../types.js";

export const SYSTEM_NAME = "Sistema";

// Enemigos que usa el servidor en las partidas contra el sistema.
export const ENEMIES: { name: string; class: CharacterClass }[] = [
  { name: "Orco Bruto", class: "guerrero" },
  { name: "Bruja del Pantano", class: "mago" },
  { name: "Arquero Esqueleto", class: "arquero" },
];
