import { Router } from "express";
import { getPlayer, getPlayers, getStatistics, updatePlayer } from "../controllers/players.controller.js";

const router = Router();

router.get("/", getPlayers);
router.get("/:id", getPlayer);
router.get("/:id/statistics", getStatistics);
router.put("/:id", updatePlayer);

export default router;
