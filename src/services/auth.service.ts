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

// Devuelve el id del jugador dueño del token, o undefined si el token no existe o ya venció.
export function getPlayerId(token: string): number | undefined {
  const session = sessions.get(token);

  if (!session) {
    return undefined;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return undefined;
  }

  return session.playerId;
}

export function removeToken(token: string): void {
  sessions.delete(token);
}

export function removeAll(): void {
  sessions.clear();
}
