import { HttpError } from "./httpError.js";

// Convierte el :id de la URL en número. Si no es un entero positivo responde 400.
export function parseId(value: string, label: string): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `El id ${label} debe ser un número entero positivo.`);
  }

  return id;
}
