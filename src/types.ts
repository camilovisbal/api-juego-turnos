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

// Lo que llega en el body de PUT /api/players/:id. Todo es opcional.
export interface UpdateProfileBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  currentPassword?: unknown;
}

export type FieldErrors = Record<string, string>;

// ---------- Personajes ----------

export type CharacterClass = "guerrero" | "mago" | "arquero";

export type StatName = "health" | "attack" | "defense" | "speed";

// health es la vida máxima del personaje.
export type Stats = Record<StatName, number>;

export interface Character extends Stats {
  id: number;
  ownerId: number;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  createdAt: string;
}

// Lo que llega en el body de POST /api/characters y PUT /api/characters/:id.
export interface CharacterBody {
  name?: unknown;
  class?: unknown;
  level?: unknown;
  experience?: unknown;
  health?: unknown;
  attack?: unknown;
  defense?: unknown;
  speed?: unknown;
}
