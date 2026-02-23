import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  createTasksBatch,
  addComment,
} from "../controllers/taskController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

// Enforce authentication for all task-related endpoints globally
router.use(verifyToken);

// Task retrieval and creation
router.get("/", getTasks);
router.post("/", createTask);
router.post("/batch", createTasksBatch);

// Task modification
router.put("/:id", updateTask);

// Task deletion (Accessible to all authenticated users based on division workflows)
router.delete("/:id", deleteTask);

// Task interactions
router.post("/:id/comments", addComment);

export default router;
