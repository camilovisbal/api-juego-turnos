import { Router } from "express";
import { resetDemo } from "../controllers/demo.controller.js";

const router = Router();

router.post("/reset", resetDemo);

export default router;
