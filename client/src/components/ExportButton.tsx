import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import type { Task } from "../types";
import toast from "react-hot-toast";

type ExportButtonProps = {
  tasks: Task[];
};

/**
 * Handles the extraction, formatting, and downloading of tasks into an Excel (.xlsx) file.
 * Maps internal database schemas to presentation-ready spreadsheet columns.
 */
export function ExportButton({ tasks }: ExportButtonProps) {
  const handleExport = () => {
    if (!tasks || tasks.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    // 1. FORMATTING DATA (Database -> Excel Structure)
    const excelData = tasks.map((t, index) => {
      // Calculate duration in days
      const start = new Date(t.startDate);
      const end =
        t.status === "done" && t.dueDate
          ? new Date(t.dueDate)
          : new Date(t.targetDate);

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Map internal status to presentation status
      let excelStatus = "To Do";
      if (t.status === "done") excelStatus = "Close";
      else if (t.status === "in_progress") excelStatus = "On Going";

      const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
          return new Date(dateStr).toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      // Compile comments into a single string for the export
      const formatComments = () => {
        if (!t.comments || t.comments.length === 0) return "";
        return t.comments
          .map((c) => {
            const date = new Date(c.createdAt).toLocaleDateString();
            return `[${date}] ${c.user}: ${c.text}`;
          })
          .join("\n");
      };

      // Safely extract department name regardless of payload structure
      const deptName =
        t.department &&
        typeof t.department === "object" &&
        "name" in t.department
          ? (t.department as { name: string }).name
          : String(t.department || "");

      // Merge native notes with comments to preserve full context in export
      const combinedNotes = [t.notes, formatComments()]
        .filter(Boolean)
        .join("\n-- Comments --\n");

      return {
        No: index + 1,
        "Item TASK ( IG Based)": t.title,
        Departemen: deptName,
        Status: excelStatus,
        Supporter: t.supporter || "",
        "PIC Other Div.": t.picOtherDiv || "",
        "Start Date": formatDate(t.startDate),
        "Target Date": formatDate(t.targetDate),
        "Completion Date": t.status === "done" ? formatDate(t.dueDate) : "",
        "Duration (days)": duration,
        Milestones: t.milestones || "",
        Progress: t.progress ? `${t.progress}%` : "0%",
        Notes: combinedNotes,
      };
    });

    // 2. WORKSHEET CREATION & STYLING
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Define column widths for better readability in Excel
    const colWidths = [
      { wch: 5 }, // No
      { wch: 45 }, // Item Task
      { wch: 15 }, // Departemen
      { wch: 12 }, // Status
      { wch: 25 }, // Supporter
      { wch: 15 }, // PIC Other
      { wch: 12 }, // Start Date
      { wch: 12 }, // Target Date
      { wch: 15 }, // Completion Date
      { wch: 10 }, // Duration
      { wch: 30 }, // Milestones
      { wch: 10 }, // Progress
      { wch: 50 }, // Notes
    ];
    worksheet["!cols"] = colWidths;

    // 3. WORKBOOK ASSEMBLY & DOWNLOAD
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Task Export");

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Task_NPBM_Export_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    toast.success("Berhasil mendownload Excel!");
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
      title="Download semua data sebagai Excel"
    >
      <Download className="w-4 h-4" />
      Export Excel
    </button>
  );
}
