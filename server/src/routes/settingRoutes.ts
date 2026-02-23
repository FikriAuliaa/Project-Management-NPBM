import { Router } from "express";
import { getSettings, updateSetting } from "../controllers/settingsController";

const router = Router();

router.get("/", getSettings);
router.post("/", updateSetting);

export default router;
