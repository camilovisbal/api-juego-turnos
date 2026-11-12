import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

// Calcula el hash de la contraseña con scrypt y una sal aleatoria.
// La sal hace que dos jugadores con la misma contraseña tengan hashes distintos.
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return { salt, hash };
}

// Vuelve a calcular el hash con la misma sal y lo compara con el guardado.
// timingSafeEqual tarda lo mismo aunque los primeros caracteres no coincidan.
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const candidate = scryptSync(password, salt, KEY_LENGTH);
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}
