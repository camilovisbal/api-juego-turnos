// ---------- Jugadores ----------

export interface Player {
  id: number;
  username: string;
  name: string;
  email: string;
  // La contraseña nunca se guarda tal cual: se guarda el hash de scrypt y la sal con la que se calculó.
  passwordHash: string;
  salt: string;
  wins: number;
  losses: number;
  createdAt: string;
}

// Lo que se devuelve en las respuestas: el jugador sin el hash ni la sal.
export type PublicPlayer = Omit<Player, "passwordHash" | "salt">;

// Lo que llega en el body de POST /api/register.
export interface RegisterBody {
  username?: unknown;
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

// Lo que llega en el body de POST /api/login.
export interface LoginBody {
  username?: unknown;
  password?: unknown;
}

export type FieldErrors = Record<string, string>;
