import { Router } from "express";
import {
  cancelGame,
  createGame,
  finishGame,
  getGame,
  getGames,
  getHistory,
  joinGame,
  playAction,
} from "../controllers/games.controller.js";

const router = Router();

router.get("/", getGames);
router.get("/:id", getGame);
router.post("/", createGame);
router.post("/:id/join", joinGame);
router.post("/:id/actions", playAction);
router.get("/:id/history", getHistory);
router.post("/:id/finish", finishGame);
router.post("/:id/cancel", cancelGame);

export default router;
