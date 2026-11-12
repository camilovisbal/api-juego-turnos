// Error con código HTTP. Los servicios lo lanzan cuando se rompe una regla
// (por ejemplo 409 si no es tu turno) y el middleware de errores lo convierte en JSON.
export class HttpError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
