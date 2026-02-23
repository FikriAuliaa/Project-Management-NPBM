import type { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const getDepartments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
    res.json(depts);
  } catch (error) {
    console.error("Fetch departments error:", error);
    res.status(500).json({ error: "Failed to retrieve departments" });
  }
};

export const createDepartment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name } = req.body;

  // Prevent empty strings or whitespace-only submissions
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Department name is required" });
    return;
  }

  const cleanName = name.trim();

  try {
    // Ensure idempotency: Case-insensitive check to prevent duplicate departments like "IT" and "it"
    const existing = await prisma.department.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
    });

    if (existing) {
      // Return existing record gracefully so the frontend can reuse the ID
      res.status(200).json(existing);
      return;
    }

    const dept = await prisma.department.create({
      data: { name: cleanName },
    });

    // HTTP 201 represents resource successfully created
    res.status(201).json(dept);
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ error: "Failed to create department" });
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.department.delete({ where: { id } });
    res.json({ message: "Department successfully deleted" });
  } catch (error) {
    // Catch specific Prisma error for "Record not found"
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    console.error("Delete department error:", error);
    // Generic catch-all, often triggered by Foreign Key constraint violations (e.g., tasks still linked)
    res
      .status(500)
      .json({
        error: "Failed to delete department. Ensure no tasks are linked to it.",
      });
  }
};
