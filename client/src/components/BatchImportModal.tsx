import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { X, Upload, Check, Save, PlusCircle, Loader2 } from "lucide-react";
import type { Task, Status } from "../types";
import { api } from "../services/api";
import { useTasks } from "../context/TasksContext";
import toast from "react-hot-toast";

type BatchImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartment: string;
};

interface RawExcelRow {
  No?: number;
  "Item TASK ( IG Based)"?: string;
  Departemen?: string;
  Status?: string;
  Supporter?: string;
  "PIC Other Div."?: string;
  "Start Date"?: number | string;
  "Target Date"?: number | string;
  "Completion Date"?: number | string;
  Milestones?: string;
  Progress?: string | number;
  Notes?: string;
}

/**
 * PreviewTask interface omits the strict 'department' relation from Task
 * to safely handle new or unmatched departments during the preview phase.
 */
interface PreviewTask extends Omit<Partial<Task>, "department"> {
  isNewDept?: boolean;
  tempDeptName?: string;
  department?: { name: string };
}

/**
 * Modal component for handling batch task imports via Excel/CSV files.
 * Includes a preview stage and automatic department creation logic.
 */
export function BatchImportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment,
}: BatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [newDepartmentsFound, setNewDepartmentsFound] = useState<string[]>([]);

  const { departments, refreshDepartments } = useTasks();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreviewData([]);
      setNewDepartmentsFound([]);
      setStep("upload");
      setProcessingStatus("");
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const formatExcelDate = (val: number | string | undefined): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === "number") {
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    if (typeof val === "string") {
      const date = new Date(val);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    return new Date().toISOString();
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json<RawExcelRow>(ws);

        const tempNewDepts = new Set<string>();

        const mappedData: PreviewTask[] = jsonData.map((row) => {
          // 1. Map Status
          let statusString = "todo";
          const rawStatus = row["Status"]
            ? String(row["Status"]).toLowerCase()
            : "";
          if (
            rawStatus.includes("close") ||
            rawStatus.includes("done") ||
            rawStatus.includes("selesai")
          ) {
            statusString = "done";
          } else if (
            rawStatus.includes("on going") ||
            rawStatus.includes("ongoing") ||
            rawStatus.includes("progress")
          ) {
            statusString = "in_progress";
          }

          // 2. Map Dates
          const startDate = formatExcelDate(row["Start Date"]);
          const targetDate = formatExcelDate(row["Target Date"]);
          const dueDate = row["Completion Date"]
            ? formatExcelDate(row["Completion Date"])
            : targetDate;

          // 3. Map Progress (Status takes precedence)
          const rawProgress = row["Progress"];
          let progressNum = 0;
          let progressText = "";

          if (
            rawProgress !== undefined &&
            rawProgress !== null &&
            rawProgress !== ""
          ) {
            progressText = String(rawProgress);
            if (typeof rawProgress === "number") {
              progressNum = rawProgress <= 1 ? rawProgress * 100 : rawProgress;
            } else {
              const match = progressText.match(/(\d+)/);
              if (match) {
                progressNum = parseInt(match[0]);
              }
            }
          }

          if (statusString === "done") {
            progressNum = 100;
          } else if (statusString === "todo") {
            progressNum = 0;
          } else if (statusString === "in_progress") {
            if (progressNum === 0 || !rawProgress) {
              progressNum = 50;
            }
          }

          if (progressNum > 100) progressNum = 100;

          // 4. Handle Department Mapping and Discovery
          const excelDeptName = row["Departemen"]
            ? String(row["Departemen"]).trim()
            : "";
          let targetDeptId = "";
          let deptNameDisplay = "";
          let isNew = false;

          if (excelDeptName) {
            const foundDept = departments.find(
              (d) => d.name.toLowerCase() === excelDeptName.toLowerCase(),
            );
            if (foundDept) {
              targetDeptId = foundDept.id;
              deptNameDisplay = foundDept.name;
            } else {
              isNew = true;
              targetDeptId = "";
              deptNameDisplay = excelDeptName;
              tempNewDepts.add(excelDeptName);
            }
          } else {
            targetDeptId = defaultDepartment;
            const def = departments.find((d) => d.id === defaultDepartment);
            deptNameDisplay = def ? def.name : "Unknown";
          }

          const description = row["Notes"] || "";

          return {
            title: row["Item TASK ( IG Based)"] || "Untitled Task",
            description,
            status: statusString as Status,
            priority: "medium",
            departmentId: targetDeptId,
            department: { name: deptNameDisplay },
            isNewDept: isNew,
            tempDeptName: deptNameDisplay,
            startDate,
            targetDate,
            dueDate,
            tags: ["Batch Import"],
            supporter: row["Supporter"] ? String(row["Supporter"]) : "",
            picOtherDiv: row["PIC Other Div."]
              ? String(row["PIC Other Div."])
              : "",
            progress: Math.round(progressNum),
            progressText,
            milestones: row["Milestones"] || "",
            notes: row["Notes"] || "",
          };
        });

        setNewDepartmentsFound(Array.from(tempNewDepts));
        setPreviewData(mappedData);
        setStep("review");
      } catch (error) {
        console.error("Excel Parsing Error:", error);
        toast.error("Gagal membaca file Excel.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSave = async () => {
    const validTasks = previewData.filter(
      (t) => t.title && t.title.trim() !== "",
    );

    if (validTasks.length === 0) {
      toast.error("Tidak ada data valid.");
      return;
    }

    try {
      setIsProcessing(true);
      const newDeptMap = new Map<string, string>();

      // Automatically provision new departments before saving tasks
      if (newDepartmentsFound.length > 0) {
        setProcessingStatus(
          `Membuat ${newDepartmentsFound.length} departemen baru...`,
        );
        for (const deptName of newDepartmentsFound) {
          try {
            const newDept = await api.createDepartment(deptName);
            newDeptMap.set(deptName.toLowerCase(), newDept.id);
          } catch (err) {
            console.error(`Failed to provision department: ${deptName}`, err);
            toast.error(`Gagal membuat departemen: ${deptName}`);
            setIsProcessing(false);
            return;
          }
        }
        await refreshDepartments();
      }

      setProcessingStatus("Menyimpan tasks...");

      const finalTasks = validTasks.map((task) => {
        let finalDeptId = task.departmentId;

        if (task.isNewDept && task.tempDeptName) {
          const newId = newDeptMap.get(task.tempDeptName.toLowerCase());
          if (newId) finalDeptId = newId;
        }

        return {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          departmentId: finalDeptId,
          startDate: task.startDate,
          targetDate: task.targetDate,
          dueDate: task.dueDate,
          supporter: task.supporter,
          picOtherDiv: task.picOtherDiv,
          progress: task.progress,
          progressText: task.progressText,
          milestones: task.milestones,
          notes: task.notes,
          tags: task.tags,
        };
      });

      await api.createTasksBatch(finalTasks);

      toast.success(`Sukses! ${finalTasks.length} Task diimport.`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Batch Save Error:", error);
      toast.error("Gagal menyimpan data.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Batch Import Task
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {step === "upload"
                ? "Upload file Excel untuk memulai"
                : `Review data dari: ${file?.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">
                Drag & Drop file Excel/CSV di sini
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Pilih File
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {newDepartmentsFound.length > 0 && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full">
                    <PlusCircle className="w-5 h-5 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                      Departemen Baru Terdeteksi
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Sistem menemukan{" "}
                      <strong>{newDepartmentsFound.length}</strong> departemen
                      baru.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newDepartmentsFound.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-1 text-xs font-medium bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-orange-100 rounded-md border border-orange-300 dark:border-orange-600"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-3 w-10">Status</th>
                      <th className="p-3 w-1/4">Task Title</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Supporter / PIC</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Target Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {previewData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${row.isNewDept ? "bg-orange-50/50 dark:bg-orange-900/10" : "bg-white dark:bg-gray-800"}`}
                      >
                        <td className="p-3 text-center">
                          {row.title ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {row.title}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          {row.isNewDept && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded border border-orange-200 font-bold">
                              NEW
                            </span>
                          )}
                          {row.department?.name}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          <div className="flex flex-col gap-1">
                            {row.supporter && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded w-fit">
                                Sup: {row.supporter}
                              </span>
                            )}
                            {row.picOtherDiv && (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded w-fit">
                                PIC: {row.picOtherDiv}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span
                              className={`font-bold ${row.progress === 100 ? "text-green-600" : "text-blue-600"}`}
                            >
                              {row.progress}%
                            </span>
                            {row.progressText && (
                              <span
                                className="text-[10px] text-gray-400 truncate max-w-[80px]"
                                title={row.progressText}
                              >
                                {row.progressText}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-xs font-mono text-gray-500">
                          {row.targetDate?.toString().split("T")[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-between items-center">
          {step === "review" && (
            <button
              onClick={() => {
                setStep("upload");
                setFile(null);
                setNewDepartmentsFound([]);
              }}
              className="text-sm text-gray-500 underline hover:text-gray-700"
              disabled={isProcessing}
            >
              Upload Ulang
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            {step === "review" && (
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 transition-all ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-md"}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {processingStatus || "Memproses..."}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {newDepartmentsFound.length > 0
                      ? "Buat Dept & Simpan"
                      : "Simpan"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
