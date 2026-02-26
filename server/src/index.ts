import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path"; // [BARU] Import module path bawaan Node.js

import departmentRoutes from "./routes/departmentRoutes";
import taskRoutes from "./routes/taskRoutes";
import userRoutes from "./routes/userRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import settingsRoutes from "./routes/settingRoutes";

dotenv.config();
const app = express();

// Secure HTTP headers (CSP dimatikan agar tidak memblokir file statis React)
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Restrict cross-origin requests to trusted frontend domains
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173"]
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// --- ROUTES API ---
app.use("/api/departments", departmentRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);

// --- [BARU] KONFIGURASI PRODUCTION UNTUK FRONTEND ---
// Jika aplikasi dijalankan di production (via Docker), Node.js akan menyajikan file React
if (process.env.NODE_ENV === "production") {
  // Asumsi file ini saat dibuild berada di server/dist/index.js
  // Maka folder client/dist berada 2 tingkat di atasnya
  const clientBuildPath = path.join(__dirname, "../../client/dist");

  // Beritahu Express untuk menyajikan file statis (HTML, CSS, JS, Image)
  app.use(express.static(clientBuildPath));

  // PENTING UNTUK REACT ROUTER:
  // Semua request URL yang tidak berawalan /api akan diarahkan ke index.html React
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
