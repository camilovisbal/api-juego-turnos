import type { Request, Response } from "express";
import { loadDemoData } from "../services/demo.service.js";

// POST /api/demo/reset
// Deja el servidor como recién encendido: solo los jugadores y personajes de prueba, sin partidas.
export function resetDemo(req: Request, res: Response) {
  const data = loadDemoData();
  res.json({ mensaje: "Se reiniciaron los datos de prueba. Vuelve a iniciar sesión.", ...data });
}
