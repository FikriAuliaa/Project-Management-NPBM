import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();
const prisma = new PrismaClient();

// Enforce authentication for all notification endpoints
router.use(verifyToken);

/**
 * Fetch the latest 50 notifications for the system.
 * Capped at 50 to ensure optimal query performance.
 */
router.get("/", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * Create a new system notification.
 */
router.post("/", async (req, res) => {
  const { title, message, type } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Notification message is required" });
    return;
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        title: title?.trim() || "System Notification",
        message: message.trim(),
        type: type || "info",
      },
    });
    res.status(201).json(notification);
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

/**
 * Mark a specific notification as read.
 */
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Update notification error:", error);
    res.status(500).json({ error: "Failed to update notification status" });
  }
});

/**
 * Mark all unread notifications as read.
 * (Note: Does not delete records to maintain audit trails).
 */
router.delete("/", async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ error: "Failed to process notifications" });
  }
});

export default router;
