import type { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Extend Express Request to strictly type the decoded JWT payload
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true },
    });

    if (!user) {
      // Use a generic error message to prevent username enumeration attacks
      res.status(401).json({ error: "Kredensial tidak valid" });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Kredensial tidak valid" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Issue HttpOnly cookie to mitigate XSS vulnerabilities
    res.cookie("token", token, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Login Error:", errorMessage);
    res.status(500).json({ error: "Login failed" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Invalidate the session on the client side
    res.clearCookie("token", {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "strict",
    });
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      department: user.department,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user profile" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Asumsi: Middleware autentikasi Anda menyimpan data user yang sedang login di req.user
    // Sesuaikan 'req.user.id' dengan cara backend Anda membaca sesi/token saat ini!
    const userId = (req as any).user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Sesi tidak valid, silakan login ulang." });
    }

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Password saat ini dan baru wajib diisi." });
    }

    // 1. Cari user di database
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }

    // 2. Cocokkan password saat ini dengan yang ada di database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      // Jika salah, tolak!
      return res.status(400).json({ error: "Password saat ini salah!" });
    }

    // 3. Jika cocok, hash (enkripsi) password yang baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Simpan password baru ke database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password berhasil diubah!" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan pada server saat mengubah password." });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: { department: true },
      orderBy: { username: "asc" },
    });

    // Strip sensitive fields (like password) before sending to client
    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      department: u.department,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data user" });
  }
};

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { username, password, role, departmentId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        ...(departmentId && { department: { connect: { id: departmentId } } }),
      },
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
      createdAt: user.createdAt,
    };

    res.json(safeUser);
  } catch (error) {
    // Handle specific Prisma unique constraint violation (P2002)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(400).json({ error: "Username sudah digunakan" });
      return;
    }
    res.status(400).json({ error: "Gagal membuat user" });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus user" });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    res.json({ message: "Password updated" });
  } catch (error) {
    res.status(500).json({ error: "Gagal reset password" });
  }
};

export const getUserActivities = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const activities = await prisma.activityLog.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};
