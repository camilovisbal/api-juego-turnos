import type { Character, Fighter, Game, HistoryEntry, Team, TeamSide } from "../types.js";

// ---------- Ayudas ----------

// Copia el personaje para usarlo en la partida, con la vida llena.
export function toFighter(character: Character): Fighter {
  return {
    characterId: character.id,
    name: character.name,
    class: character.class,
    level: character.level,
    maxHealth: character.health,
    health: character.health,
    attack: character.attack,
    defense: character.defense,
    speed: character.speed,
    defending: false,
    specialCooldown: 0,
    healsLeft: 3,
    defeated: false,
  };
}

// El personaje que está peleando: el primero del equipo que no ha sido derrotado.
export function activeFighter(team: Team): Fighter | undefined {
  return team.fighters.find((fighter) => !fighter.defeated);
}

export function getTeam(game: Game, side: TeamSide): Team {
  return side === "creator" ? game.creator : (game.opponent as Team);
}

export function otherSide(side: TeamSide): TeamSide {
  return side === "creator" ? "opponent" : "creator";
}

export function addEntry(game: Game, entry: Omit<HistoryEntry, "turn" | "createdAt">): void {
  game.history.push({ turn: game.turn, ...entry, createdAt: new Date().toISOString() });
}

export function addEvent(game: Game, message: string): void {
  addEntry(game, { type: "evento", message });
}

// ---------- Inicio de la partida ----------

// Empieza el equipo cuyo primer personaje tenga más velocidad. Si empatan, empieza quien creó la partida.
export function startGame(game: Game): void {
  const creatorFighter = activeFighter(game.creator) as Fighter;
  const opponentFighter = activeFighter(getTeam(game, "opponent")) as Fighter;

  game.status = "En curso";
  game.startedAt = new Date().toISOString();
  game.turn = 1;
  game.turnOf = opponentFighter.speed > creatorFighter.speed ? "opponent" : "creator";

  const first = getTeam(game, game.turnOf);
  const speeds = `${creatorFighter.name} ${creatorFighter.speed} contra ${opponentFighter.name} ${opponentFighter.speed}`;

  if (creatorFighter.speed === opponentFighter.speed) {
    addEvent(game, `La partida comenzó. La velocidad está empatada (${speeds}), empieza ${first.playerName} por haber creado la partida.`);
  } else {
    addEvent(game, `La partida comenzó. Empieza ${first.playerName} porque su personaje es más rápido (${speeds}).`);
  }
}
