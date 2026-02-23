import { Router } from "express";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "../controllers/departmentController";
import { verifyToken, isManager } from "../middleware/authMiddleware";

const router = Router();

// Retrieve all departments (Accessible to any authenticated user)
router.get("/", verifyToken, getDepartments);

// Create a new department (Restricted to Managers and Admins)
router.post("/", verifyToken, isManager, createDepartment);

// Delete an existing department (Restricted to Managers and Admins)
router.delete("/:id", verifyToken, isManager, deleteDepartment);

export default router;
