import {
  HelpCircle,
  FileSpreadsheet,
  Layout,
  CheckCircle,
  Shield,
  MessageSquare,
  BarChart3,
  Link as LinkIcon,
  Bell,
  CalendarDays,
  List,
} from "lucide-react";

export function HelpPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-2">
          <HelpCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Pusat Bantuan & Panduan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Pelajari cara memaksimalkan penggunaan Task Management System. Panduan
          ini mencakup navigasi dashboard, kolaborasi tim, hingga manajemen data
          tingkat lanjut.
        </p>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* SECTION 1: DASHBOARD & FILTER */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Dashboard & Analitik
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <span>
                <strong>Metrik Kesehatan:</strong> Pantau task yang{" "}
                <em>Overdue</em> (lewat tenggat waktu), prioritas tinggi, dan
                tenggat waktu 7 hari ke depan.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <span>
                <strong>Filter Periode:</strong> Gunakan filter di kanan atas
                dashboard untuk melihat data berdasarkan Tahun, Semester
                (H1/H2), Kuartal (Q1-Q4), atau Bulan.
              </span>
            </li>
          </ul>
        </div>

        {/* SECTION 2: MULTI-VIEW */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
              <Layout className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Tampilan Data (Views)
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <Layout className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <span>
                <strong>Kanban:</strong> <em>Drag & Drop</em> kartu untuk
                mengubah status dengan cepat. Diurutkan otomatis atau kustom.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <List className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <span>
                <strong>List View:</strong> Tabel dengan fitur <em>Expand</em>{" "}
                (klik panah kiri) untuk melihat detail notes & komentar, plus
                kolom <em>Sticky</em>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <span>
                <strong>Calendar:</strong> Pantau beban kerja harian. Task akan
                muncul di tanggal <em>Target Date</em>.
              </span>
            </li>
          </ul>
        </div>

        {/* SECTION 3: MANAJEMEN TASK & PROGRESS */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Manajemen Task
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                <strong>Auto-Sync Progress:</strong> Status <em>Done</em>{" "}
                otomatis mengisi progress 100%. <em>To Do</em> menjadi 0%.{" "}
                <em>In Progress</em> dapat diatur manual via slider (0-100%).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                <strong>Milestones:</strong> Tekan <code>Enter</code> saat
                mengetik milestone untuk otomatis menambahkan tanggal hari ini.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <span>
                <strong>PIC & Supporter:</strong> Kolom khusus untuk
                mendelegasikan tugas lintas divisi.
              </span>
            </li>
          </ul>
        </div>

        {/* SECTION 4: IMPORT & EXPORT EXCEL */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Import & Export
            </h2>
          </div>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>
              <strong>Batch Import:</strong> Upload file <code>.xlsx</code>{" "}
              untuk memasukkan banyak data. Sistem akan memunculkan tabel{" "}
              <em>Preview</em> sebelum disimpan.
            </p>
            <div className="p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">
                Smart Auto-Create:
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Jika nama departemen di Excel belum ada di sistem, sistem akan
                mendeteksinya dan menawarkan pembuatan departemen baru otomatis.
              </p>
            </div>
            <p>
              <strong>Export:</strong> Hasil export Excel akan mencakup durasi
              hari dan menggabungkan <em>Notes</em> beserta riwayat{" "}
              <em>Comments</em> agar tidak ada konteks yang hilang.
            </p>
          </div>
        </div>

        {/* SECTION 5: KOLABORASI & LAMPIRAN */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Komentar & Lampiran
            </h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <span>
                <strong>Diskusi:</strong> Tinggalkan komentar di detail task.
                Arahkan kursor (hover) ke ikon chat di kartu Kanban untuk
                melihat 3 komentar terakhir tanpa membuka task.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <span>
                <strong>Attachments (Tautan):</strong> Tambahkan link eksternal
                (Google Drive, Docs, Figma) di menu Edit. Sistem otomatis
                memvalidasi protokol <code>http/https</code>.
              </span>
            </li>
          </ul>
        </div>

        {/* SECTION 6: HAK AKSES & KEAMANAN */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Akses & Notifikasi
            </h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10 rounded-r-lg">
              <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">
                Role: Manager / Admin
              </h4>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                Bisa membuat/menghapus departemen, melihat "All Tasks", dan
                mengedit task di <strong>semua divisi</strong>.
              </p>
            </div>
            <div className="p-3 border-l-4 border-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
              <h4 className="font-bold text-slate-800 dark:text-slate-300 text-sm">
                Role: Staff / User
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Hanya bisa mengedit task di divisinya sendiri. Task dari divisi
                lain bersifat <em>Read-Only</em> (Ikon Gembok 🔒).
              </p>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <Bell className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Setiap pembuatan task baru atau peringatan sistem akan
                dikirimkan melalui fitur <strong>Notifikasi Lonceng</strong> di
                sudut kanan atas layar.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Contact */}
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 mt-8">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          Mengalami Kendala Teknis?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-lg mx-auto">
          Setiap aktivitas di sistem ini memiliki <em>Audit Trail</em> otomatis.
          Hubungi tim IT Support untuk bantuan pelacakan data, reset password,
          atau error pada sistem.
        </p>
      </div>
    </div>
  );
}
