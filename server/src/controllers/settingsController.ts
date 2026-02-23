import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat pengaturan sistem" });
  }
};

export const updateSetting = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { key, value } = req.body;
  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan pengaturan" });
  }
};
