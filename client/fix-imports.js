import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Konfigurasi Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderPath = path.join(__dirname, "src", "components", "ui");

// Baca semua file di folder UI
fs.readdir(folderPath, (err, files) => {
  if (err) {
    return console.error("Gagal membaca folder: " + folderPath, err);
  }

  files.forEach((file) => {
    if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const filePath = path.join(folderPath, file);

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) return console.error(err);

        // Regex sakti untuk menghapus @version (misal: @1.2.3)
        const result = data.replace(/@\d+\.\d+\.\d+/g, "");

        if (data !== result) {
          fs.writeFile(filePath, result, "utf8", (err) => {
            if (err) return console.error(err);
            console.log(`✅ Berhasil memperbaiki: ${file}`);
          });
        }
      });
    }
  });
});
