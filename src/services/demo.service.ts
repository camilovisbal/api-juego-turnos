import * as playersService from "./players.service.js";
import * as charactersService from "./characters.service.js";
import * as gamesService from "./games.service.js";
import * as authService from "./auth.service.js";
import { seedCharacters, seedPlayers } from "../data/seed.js";
import { baseStats } from "../data/classes.js";
import type { Player } from "../types.js";

// Borra todo lo que hay en memoria y vuelve a cargar los jugadores y personajes de prueba.
// También borra los tokens, así que después hay que volver a iniciar sesión.
export function loadDemoData() {
  authService.removeAll();
  gamesService.removeAll();
  charactersService.removeAll();
  playersService.removeAll();

  const players = seedPlayers.map((data) => playersService.create(data));

  const characters = seedCharacters.map((data) => {
    const owner = playersService.findByUsername(data.owner) as Player;
    return charactersService.create(owner.id, { name: data.name, class: data.class, stats: baseStats(data.class, 1) });
  });

  return { players: players.map(playersService.toPublic), characters };
}
