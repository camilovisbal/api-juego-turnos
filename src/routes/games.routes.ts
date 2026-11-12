import { Router } from "express";
import { createGame, getGame, getGames, joinGame } from "../controllers/games.controller.js";

const router = Router();

router.get("/", getGames);
router.get("/:id", getGame);
router.post("/", createGame);
router.post("/:id/join", joinGame);

export default router;
