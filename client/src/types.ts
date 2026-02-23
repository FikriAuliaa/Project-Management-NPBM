export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "done";

export type SortOption =
  | "date-earliest"
  | "date-latest"
  | "priority-high"
  | "priority-low"
  | "custom"
  | "progress-high"
  | "progress-low"
  | "title-asc"
  | "title-desc"; // Pastikan ini ada untuk ListView

export type NotificationType = "info" | "success" | "warning" | "error";
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string; // atau Date
  // userId? : string (opsional jika ada relasi ke user)
}

export type Department = {
  id: string;
  name: string;
};

// 1. Definisikan tipe untuk Attachment agar tidak pakai 'any'
export type Attachment = {
  id: string; // Wajib string
  name: string;
  type: "file" | "link";
  url: string;
  size?: string; // Opsional (string | undefined)
  uploadedAt: string; // Wajib string
};

// 2. Definisikan tipe Comment (sudah ada di bawah, bisa dipindah ke atas atau biarkan)
export type Comment = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;

  departmentId: string;
  department?: Department | string; // Support object (dari DB) atau string (dari UI/Legacy)

  status: Status;
  priority: Priority;

  supporter?: string;
  picOtherDiv?: string;

  dueDate?: string;
  startDate: string;
  targetDate: string;

  milestones?: string;
  progress: number;
  progressText?: string;

  // 3. GUNAKAN TIPE SPESIFIK (BUKAN ANY)
  comments?: Comment[];
  attachments?: Attachment[];

  tags?: string[];
  notes?: string;
};
