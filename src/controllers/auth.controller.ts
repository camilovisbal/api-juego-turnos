import type { Request, Response } from "express";
import * as playersService from "../services/players.service.js";
import * as authService from "../services/auth.service.js";
import { validateRegister } from "../utils/validatePlayer.js";
import { verifyPassword } from "../utils/password.js";
import type { LoginBody, RegisterBody } from "../types.js";

// POST /api/register
// Body: { "username": "sofia", "name": "Sofía", "email": "sofia@correo.com", "password": "sofia123" }
export function register(req: Request<{}, {}, RegisterBody>, res: Response) {
  const result = validateRegister(req.body ?? {});

  // 400: datos mal escritos.
  if (!result.isValid) {
    res.status(400).json({ error: "Hay datos inválidos en el registro.", errors: result.errors });
    return;
  }

  // 409: el usuario o el correo ya están registrados.
  if (playersService.findByUsername(result.username)) {
    res.status(409).json({ error: `El usuario "${result.username}" ya está registrado.` });
    return;
  }

  if (playersService.findByEmail(result.email)) {
    res.status(409).json({ error: `Ya hay un jugador registrado con el correo ${result.email}.` });
    return;
  }

  // 201: jugador creado. Se responde sin la contraseña.
  const player = playersService.create(result);
  res.status(201).json(playersService.toPublic(player));
}

// POST /api/login
// Body: { "username": "sofia", "password": "sofia123" }
export function login(req: Request<{}, {}, LoginBody>, res: Response) {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    res.status(400).json({ error: "Escribe el usuario y la contraseña." });
    return;
  }

  const player = playersService.findByUsername(username.trim());

  // 401: el mismo mensaje si el usuario no existe o si la contraseña está mal,
  // para no dar pistas de qué usuarios existen.
  if (!player || !verifyPassword(password, player.salt, player.passwordHash)) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    return;
  }

  const { token, expiresAt } = authService.createToken(player.id);
  res.json({ mensaje: `Bienvenido, ${player.name}.`, token, expiresAt, player: playersService.toPublic(player) });
}

// POST /api/logout
// Borra el token de la memoria, así ya no sirve aunque alguien lo tenga copiado.
export function logout(req: Request, res: Response) {
  authService.removeToken(res.locals.token as string);
  res.status(204).end();
}
