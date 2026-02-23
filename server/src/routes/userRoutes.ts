import { Router } from "express";
import {
  login,
  logout,
  getMe,
  getAllUsers,
  createUser,
  deleteUser,
  resetPassword,
  getUserActivities,
} from "../controllers/userController";
import { verifyToken, isAdmin } from "../middleware/authMiddleware";

const router = Router();

/**
 * Public Endpoints
 * Accessible without authentication.
 */
router.post("/login", login);
router.post("/logout", logout);

/**
 * Protected User Endpoints
 * Requires a valid session/JWT token.
 */
router.get("/me", verifyToken, getMe);
router.get("/activities", verifyToken, getUserActivities);

/**
 * Administrative Endpoints
 * Strictly requires System Administrator privileges.
 */
router.get("/", verifyToken, isAdmin, getAllUsers);
router.post("/", verifyToken, isAdmin, createUser);
router.delete("/:id", verifyToken, isAdmin, deleteUser);
router.put("/:id/reset-password", verifyToken, isAdmin, resetPassword);

export default router;
