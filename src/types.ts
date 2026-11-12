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

// ---------- Partidas ----------

export type GameStatus = "Pendiente" | "En curso" | "Finalizada" | "Cancelada";

// "jugador": contra otro jugador. "sistema": contra enemigos que controla el servidor.
export type GameMode = "jugador" | "sistema";

export type ActionName = "atacar" | "defender" | "habilidad" | "curar";

// creator es el equipo de quien creó la partida y opponent el del rival.
export type TeamSide = "creator" | "opponent";

// Copia de un personaje dentro de una partida. Se copia para que la vida que pierde en el combate
// no cambie al personaje original, y para que editarlo después no cambie partidas viejas.
export interface Fighter {
  characterId: number | null; // null en los enemigos del sistema
  name: string;
  class: CharacterClass;
  level: number;
  maxHealth: number;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  defending: boolean;
  specialCooldown: number; // turnos propios que faltan para volver a usar la habilidad
  healsLeft: number;
  defeated: boolean;
}

export interface Team {
  playerId: number | null; // null cuando es el sistema
  playerName: string;
  fighters: Fighter[];
}

export interface HistoryEntry {
  turn: number;
  type: "accion" | "evento";
  player?: string;
  actor?: string;
  action?: ActionName;
  target?: string;
  damage?: number;
  healing?: number;
  targetHealth?: number;
  actorHealth?: number;
  message: string;
  createdAt: string;
}

export interface Game {
  id: number;
  mode: GameMode;
  status: GameStatus;
  createdBy: number;
  invitedPlayerId: number | null;
  creator: Team;
  opponent: Team | null; // null mientras nadie se une
  turn: number;
  turnOf: TeamSide | null;
  winnerPlayerId: number | null;
  winnerName: string | null;
  history: HistoryEntry[];
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

// Body de POST /api/games.
export interface NewGameBody {
  characterIds?: unknown;
  mode?: unknown;
  invitedPlayerId?: unknown;
}

// Body de POST /api/games/:id/join.
export interface JoinGameBody {
  characterIds?: unknown;
}

// Body de POST /api/games/:id/actions.
export interface ActionBody {
  action?: unknown;
}
