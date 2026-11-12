import { randomUUID } from "node:crypto";

// Cada sesión dura 8 horas. Después hay que volver a iniciar sesión.
const SESSION_HOURS = 8;

interface Session {
  playerId: number;
  expiresAt: number;
}

// Los tokens se guardan en memoria: token -> jugador al que pertenece.
const sessions = new Map<string, Session>();

export function createToken(playerId: number): { token: string; expiresAt: string } {
  const token = randomUUID();
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;

  sessions.set(token, { playerId, expiresAt });
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}
