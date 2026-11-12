import type { Player, PublicPlayer } from "../types.js";
import { hashPassword } from "../utils/password.js";

// Los jugadores viven en la memoria del servidor: duran mientras el servidor esté encendido.
let players: Player[] = [];
let nextId = 1;

// Quita el hash y la sal antes de responder.
export function toPublic(player: Player): PublicPlayer {
  const { passwordHash: _hash, salt: _salt, ...publicPlayer } = player;
  return publicPlayer;
}

export function getAll(): Player[] {
  return players;
}

export function findById(id: number): Player | undefined {
  return players.find((player) => player.id === id);
}

export function findByUsername(username: string): Player | undefined {
  return players.find((player) => player.username.toLowerCase() === username.toLowerCase());
}

export function findByEmail(email: string): Player | undefined {
  return players.find((player) => player.email === email.toLowerCase());
}

export function create(data: { username: string; name?: string; email: string; password: string }): Player {
  const { salt, hash } = hashPassword(data.password);

  const player: Player = {
    id: nextId++,
    username: data.username,
    name: data.name ?? data.username,
    email: data.email,
    passwordHash: hash,
    salt,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString(),
  };

  players = [...players, player];
  return player;
}

export function update(id: number, changes: { name?: string; email?: string; password?: string }): Player {
  const player = findById(id) as Player;

  if (changes.name) player.name = changes.name;
  if (changes.email) player.email = changes.email;

  if (changes.password) {
    const { salt, hash } = hashPassword(changes.password);
    player.salt = salt;
    player.passwordHash = hash;
  }

  return player;
}

// Suma una victoria o una derrota al terminar una partida.
export function recordResult(id: number, won: boolean): void {
  const player = findById(id);

  if (player && won) player.wins += 1;
  if (player && !won) player.losses += 1;
}
