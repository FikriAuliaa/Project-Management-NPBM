import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"; // Gunakan 'bcryptjs' jika Anda memakai bcryptjs

const prisma = new PrismaClient();

async function main() {
  // 1. Hash password agar aman dan bisa dibaca oleh sistem login kita
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 2. Buat akun Admin
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      password: hashedPassword,
      role: "Admin",
    },
  });

  console.log("✅ Akun Admin Pertama Berhasil Dibuat!");
  console.log("➡️ Username: admin");
  console.log("➡️ Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
