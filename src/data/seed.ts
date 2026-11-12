import type { CharacterClass } from "../types.js";

// Jugadores de prueba que se cargan al arrancar el servidor y con POST /api/demo/reset.
// Las contraseñas se guardan con hash al cargarlos, igual que en el registro.
export const seedPlayers = [
  { username: "camilo", name: "Camilo", email: "camilo@juego.com", password: "camilo123" },
  { username: "andrea", name: "Andrea", email: "andrea@juego.com", password: "andrea123" },
  { username: "luis", name: "Luis", email: "luis@juego.com", password: "luis123" },
];

// Dos personajes por jugador, con las estadísticas por defecto de su clase.
export const seedCharacters: { owner: string; name: string; class: CharacterClass }[] = [
  { owner: "camilo", name: "Thorin", class: "guerrero" },
  { owner: "camilo", name: "Lyra", class: "arquero" },
  { owner: "andrea", name: "Merlín", class: "mago" },
  { owner: "andrea", name: "Aria", class: "arquero" },
  { owner: "luis", name: "Grom", class: "guerrero" },
  { owner: "luis", name: "Zafira", class: "mago" },
];
