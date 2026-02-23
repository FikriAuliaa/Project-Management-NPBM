import type { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { logActivity } from "../utils/activityLogger";
import type { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

interface AttachmentInput {
  name: string;
  url: string;
  type: string;
}

interface TaskInput {
  title: string;
  description?: string;
  departmentId?: string;
  status?: string;
  priority?: string;
  startDate?: string | null;
  targetDate?: string | null;
  dueDate?: string | null;
  supporter?: string;
  picOtherDiv?: string;
  progress?: number | string;
  progressText?: string;
  milestones?: string;
  tags?: string[];
  attachments?: AttachmentInput[];
}

/**
 * Retrieve all tasks with their relational data.
 * Optimized for dashboard viewing by ordering by latest creation date.
 */
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        department: true,
        comments: { orderBy: { createdAt: "desc" } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
};

/**
 * Create a new task and log the creation event.
 * Includes explicit input validation to prevent Prisma constraint errors.
 */
export const createTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const body = req.body as TaskInput;
  const userId = req.user?.id;

  // Input sanitization: title is strictly required by the database schema
  if (!body.title || !body.title.trim()) {
    res.status(400).json({ error: "Task title is required" });
    return;
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description || "",
        departmentId: body.departmentId || null,
        status: body.status || "todo",
        priority: body.priority || "medium",
        startDate: body.startDate ? new Date(body.startDate) : null,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        progress: Number(body.progress) || 0,
        progressText: body.progressText || "",
        supporter: body.supporter || "",
        picOtherDiv: body.picOtherDiv || "",
        milestones: body.milestones || "",
        tags: Array.isArray(body.tags) ? body.tags : [],
        attachments: {
          create: Array.isArray(body.attachments)
            ? body.attachments.map((att) => ({
                name: att.name,
                url: att.url,
                type: "link",
              }))
            : [],
        },
      },
      include: { department: true, attachments: true },
    });

    await logActivity(userId, "Created a new task", task.title, null, task.id);
    res.status(201).json(task);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
};

/**
 * Bulk insert tasks using Prisma Transactions.
 * Ensures atomicity: if one task fails, the entire batch operation is rolled back.
 */
export const createTasksBatch = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tasks = req.body;

    // Ensure payload is a valid array to prevent iteration errors
    if (!Array.isArray(tasks) || tasks.length === 0) {
      res
        .status(400)
        .json({
          error: "Invalid payload. Expected a non-empty array of tasks.",
        });
      return;
    }

    const createdTasks = await prisma.$transaction(
      tasks.map((t: TaskInput) => {
        return prisma.task.create({
          data: {
            title: t.title,
            description: t.description || "",
            status: t.status || "todo",
            priority: t.priority || "medium",
            departmentId: t.departmentId || null,
            startDate: t.startDate ? new Date(t.startDate) : null,
            targetDate: t.targetDate ? new Date(t.targetDate) : null,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            progress: Number(t.progress) || 0,
            progressText: t.progressText || "",
            supporter: t.supporter || "",
            picOtherDiv: t.picOtherDiv || "",
            milestones: t.milestones || "",
            tags: Array.isArray(t.tags) ? t.tags : [],
          },
        });
      }),
    );

    res.status(201).json(createdTasks);
  } catch (error) {
    console.error("Batch import error:", error);
    res.status(500).json({ error: "Failed to import batch tasks" });
  }
};

/**
 * Update an existing task.
 * Utilizes transaction to safely replace nested attachments without leaving orphans.
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const body = req.body as TaskInput;
  const userId = req.user?.id;

  try {
    const oldTask = await prisma.task.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!oldTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Overwrite attachments strategy: delete existing records, then insert new ones
      if (Array.isArray(body.attachments)) {
        await tx.attachment.deleteMany({ where: { taskId: id } });
        if (body.attachments.length > 0) {
          await tx.attachment.createMany({
            data: body.attachments.map((att) => ({
              taskId: id,
              name: att.name,
              url: att.url,
              type: "link",
            })),
          });
        }
      }

      return await tx.task.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description,
          status: body.status,
          priority: body.priority,
          departmentId: body.departmentId,
          startDate: body.startDate
            ? new Date(body.startDate)
            : body.startDate === null
              ? null
              : undefined,
          targetDate: body.targetDate
            ? new Date(body.targetDate)
            : body.targetDate === null
              ? null
              : undefined,
          dueDate: body.dueDate
            ? new Date(body.dueDate)
            : body.dueDate === null
              ? null
              : undefined,
          progress:
            body.progress !== undefined ? Number(body.progress) : undefined,
          progressText: body.progressText,
          supporter: body.supporter,
          picOtherDiv: body.picOtherDiv,
          milestones: body.milestones,
          ...(body.tags !== undefined && { tags: body.tags }),
        },
        include: { department: true, comments: true, attachments: true },
      });
    });

    // Dynamic logging context based on whether the status changed or general details were updated
    let actionStr = "Updated task details";
    if (body.status && oldTask.status !== body.status) {
      actionStr = `Updated task status to ${body.status}`;
    }
    await logActivity(userId, actionStr, result.title, null, result.id);

    res.json(result);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

/**
 * Delete a task.
 * Cascading deletes (if configured in Prisma schema) will handle related comments/attachments.
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { title: true },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({ where: { id } });
    await logActivity(userId, "Deleted task", task.title);

    res.json({ message: "Task successfully deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

/**
 * Append a new comment to a specific task.
 */
export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { text, user } = req.body;
  const userId = req.user?.id;

  // Validate comment text to prevent empty submissions
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Comment text cannot be empty" });
    return;
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        text: text.trim(),
        user: user || "Anonymous",
        taskId: id,
        userId: userId || null,
      },
    });

    const task = await prisma.task.findUnique({
      where: { id },
      select: { title: true },
    });

    if (task) {
      await logActivity(userId, "Added a comment on", task.title, text, id);
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};
