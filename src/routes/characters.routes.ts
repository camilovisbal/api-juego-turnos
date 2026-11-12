import { Router } from "express";
import {
  createCharacter,
  deleteCharacter,
  getCharacter,
  getCharacters,
  updateCharacter,
} from "../controllers/characters.controller.js";

const router = Router();

router.get("/", getCharacters);
router.get("/:id", getCharacter);
router.post("/", createCharacter);
router.put("/:id", updateCharacter);
router.delete("/:id", deleteCharacter);

export default router;
