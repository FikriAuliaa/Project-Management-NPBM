# NPBM Task and Project Management

Sistem manajemen proyek dan tugas terintegrasi yang dirancang untuk memfasilitasi kolaborasi antar departemen, pelacakan target, dan manajemen beban kerja berbasis Role-Based Access Control (RBAC).

## Arsitektur & Teknologi (Tech Stack)

Aplikasi ini menggunakan arsitektur Full-Stack JavaScript modern dengan pemisahan yang jelas antara Client dan Server guna memastikan skalabilitas dan kemudahan pemeliharaan.

* **Frontend:** React.js (Vite), TypeScript, Tailwind CSS, Recharts (Data Visualization), Lucide React (Icons), React Router, TanStack Query.
* **Backend:** Node.js, Express.js, RESTful API.
* **Database & ORM:** PostgreSQL, Prisma ORM.
* **DevOps & Deployment:** Docker, Docker Compose, GitHub Actions (CI/CD Automated Deployment), Nginx/Cloudflare (SSL & Proxy).

## Fitur Utama (Core Features)

1.  **Role-Based Access Control (RBAC):** Hierarki akses (Administrator, Manager, Staff) dengan visibilitas data yang diisolasi per departemen.
2.  **Interactive Dashboards:** Visualisasi data real-time menggunakan Pie Chart dan Bar Chart untuk memantau metrik kesehatan tugas (Overdue, High Priority, Upcoming).
3.  **Multi-View Task Board:** Manajemen tugas interaktif yang mendukung mode Kanban Board, List View, dan Calendar View.
4.  **Data Portability:** Kemampuan mengekspor laporan ke format Excel dan mengimpor data tugas secara masal langsung melalui Dashboard.
5.  **Dynamic System Rules:** Pengaturan "Global Task Board" dan "Delegated Manager" secara dinamis melalui antarmuka UI tanpa modifikasi kode.
6.  **Security & Privacy:** Manajemen tema (Dark/Light), pengaturan tampilan compact, serta fitur penggantian kata sandi mandiri (Self-service password change).

---

## Persyaratan Sistem (Prerequisites)

Pastikan lingkungan server atau komputer lokal telah terpasang komponen berikut:
* Node.js (v18.x atau lebih baru)
* PostgreSQL (v14.x atau lebih baru)
* Docker & Docker Compose (Untuk tahap Production)
* Git

---

## Panduan Instalasi Lokal (Development Setup)

Gunakan langkah-langkah berikut untuk menjalankan aplikasi di mesin lokal untuk keperluan modifikasi kode atau debugging.

### 1. Kloning Repositori
```bash
git clone [https://github.com/FikriAuliaa/Project-Management-NPBM.git](https://github.com/FikriAuliaa/Project-Management-NPBM.git)
cd Project-Management-NPBM
```

### 2. Konfigurasi Environment Variables
Salin file .env.example menjadi .env di direktori Server dan Client, lalu sesuaikan nilainya dengan kredensial database lokal Anda.

```bash
# Direktori backend/server
cp .env.example .env
# Direktori frontend/client
cp .env.example .env
3. Setup Database (Prisma)
Pastikan layanan PostgreSQL sudah berjalan, lalu jalankan perintah berikut untuk migrasi dan seeding:
```

```bash
# Masuk ke direktori backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
4. Menjalankan Aplikasi
Buka dua terminal terpisah untuk menjalankan sisi Backend dan Frontend secara bersamaan.
```

```bash
# Terminal 1 (Backend)
npm run dev
Bash
# Terminal 2 (Frontend)
cd client
npm install
npm run dev
```

## Panduan Deployment Server (Production)
Aplikasi ini dirancang untuk berjalan di dalam Docker Containers guna menjamin konsistensi lingkungan dan isolasi keamanan.

#### Mode Manual (Docker Compose)
Untuk menjalankan deployment secara manual di server, eksekusi perintah berikut:

```Bash
# Build dan jalankan container di background (detached mode)
sudo docker-compose up -d --build
```

```Bash
# Jalankan migrasi dan sinkronisasi database di dalam container
sudo docker exec -it projectkeep_app npx prisma migrate deploy
sudo docker exec -it projectkeep_app npx prisma db seed
```

### Mode Otomatis (CI/CD GitHub Actions)
Sistem dilengkapi dengan workflow CI/CD. Setiap perubahan pada branch main akan memicu GitHub Actions untuk:
- Melakukan autentikasi ke server VPS via SSH.
- Menarik (pull) kode terbaru dari repositori.
- Melakukan rebuild pada Docker container (Zero-downtime deployment strategy).
- Manajemen Database
  
## Perintah esensial untuk pemeliharaan database PostgreSQL melalui Prisma ORM di lingkungan produksi:

### Mereset database ke kondisi awal:
```Bash
sudo docker exec -it projectkeep_app npx prisma migrate reset
```

### Membuka antarmuka GUI Prisma Studio:

```Bash
sudo docker exec -it projectkeep_app npx prisma studio
```
Catatan: Disarankan menggunakan DBeaver atau Database Client sejenis dengan koneksi langsung ke port 5432 untuk administrasi tingkat lanjut.

## Kredensial Default (PENTING)
Setelah proses npx prisma db seed selesai, sistem akan membuat satu akun Administrator utama. Pengguna diwajibkan segera mengganti kata sandi default demi keamanan.

```
Username: admin
Password: admin123 (Harap segera diganti melalui menu Profile Settings)
```
