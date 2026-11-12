import { Router } from "express";
import { getPlayer, getPlayers, updatePlayer } from "../controllers/players.controller.js";

const router = Router();

router.get("/", getPlayers);
router.get("/:id", getPlayer);
router.put("/:id", updatePlayer);

export default router;
