import { useEffect } from "react";
import { useForm, useWatch, type Control, Controller } from "react-hook-form";
import type { Task, Attachment } from "../types";
import {
  X,
  Calendar as CalendarIcon,
  User,
  Flag,
  Paperclip,
} from "lucide-react";
import { AttachmentInput } from "./AttachmentInput";
import { MilestoneInput } from "./MilestoneInput";
import { useTasks } from "../context/TasksContext";

type EditTaskModalProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => void;
};

// Interface Form
type TaskFormValues = {
  title: string;
  description: string;
  departmentId: string;
  status: Task["status"];
  priority: Task["priority"];
  tags: string;
  startDate: string;
  targetDate: string;
  dueDate: string;
  supporter: string;
  picOtherDiv: string;
  milestones: string;
  notes: string;
  progress: number;
  attachments: Attachment[];
};

// Helper date formatter
const formatDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSubmit,
}: EditTaskModalProps) {
  const { departments } = useTasks();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      status: "todo",
      priority: "medium",
      tags: "",
      startDate: "",
      targetDate: "",
      dueDate: "",
      supporter: "",
      picOtherDiv: "",
      milestones: "",
      notes: "",
      progress: 0,
      attachments: [],
    },
  });

  // --- WATCH VALUES ---
  const attachments = useWatch({ control, name: "attachments" }) || [];
  const watchedStatus = useWatch({ control, name: "status" });
  const watchedProgress = useWatch({ control, name: "progress" });

  // --- SYNC 1: PROGRESS -> STATUS ---
  useEffect(() => {
    const p = Number(watchedProgress || 0);
    if (p === 100 && watchedStatus !== "done") {
      setValue("status", "done");
    } else if (p > 0 && p < 100 && watchedStatus !== "in_progress") {
      setValue("status", "in_progress");
    } else if (p === 0 && watchedStatus !== "todo") {
      setValue("status", "todo");
    }
  }, [watchedProgress, watchedStatus, setValue]);

  // --- SYNC 2: STATUS -> PROGRESS ---
  useEffect(() => {
    const s = watchedStatus;
    const currentP = Number(watchedProgress || 0);
    if (s === "done" && currentP !== 100) {
      setValue("progress", 100);
    } else if (s === "todo" && currentP !== 0) {
      setValue("progress", 0);
    } else if (s === "in_progress" && (currentP === 0 || currentP === 100)) {
      setValue("progress", 50);
    }
  }, [watchedStatus, watchedProgress, setValue]);

  // --- POPULATE DATA ---
  useEffect(() => {
    if (isOpen && task) {
      let initialDeptId = "";
      // Logic department ID handling
      if (task.department) {
        if (typeof task.department === "object" && "id" in task.department) {
          initialDeptId = (task.department as { id: string }).id;
        } else if (typeof task.department === "string") {
          initialDeptId = task.department;
        }
      } else if (task.departmentId) {
        initialDeptId = task.departmentId;
      }

      reset({
        title: task.title || "",
        description: task.description || "",
        departmentId: initialDeptId,
        status: task.status || "todo",
        priority: task.priority || "medium",
        tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
        startDate: formatDate(task.startDate),
        targetDate: formatDate(task.targetDate),
        dueDate: formatDate(task.dueDate),
        supporter: task.supporter || "",
        picOtherDiv: task.picOtherDiv || "",
        // Pastikan milestones dimuat stringnya agar MilestoneInput bisa memecahnya
        milestones: task.milestones || "",
        notes: task.notes || "",
        progress: task.progress || 0,
        attachments: task.attachments || [],
      });
    }
  }, [isOpen, task, reset]);

  // --- SUBMIT ---
  const onFormSubmit = (data: TaskFormValues) => {
    if (!task) return;

    const { tags, ...restData } = data;

    const updatedTask: Task = {
      ...task,
      ...restData,
      // Konversi tags string kembali ke array
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      // Handle tanggal kosong
      dueDate: data.dueDate ? data.dueDate : undefined,
    };

    onSubmit(updatedTask);
    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700">
        {/* HEADER */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Edit Task
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Update task details and progress
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE FORM CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-white dark:bg-slate-800">
          <form
            id="edit-task-form"
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-8"
          >
            {/* 1. Main Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title", { required: true })}
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.title ? "border-red-500 focus:ring-red-500/20" : ""}`}
                  placeholder="Task title"
                />
                {errors.title && (
                  <span className="text-xs text-red-500 mt-1 pl-1">
                    Title is required
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] resize-y"
                  placeholder="Describe the task details..."
                />
              </div>
            </div>

            {/* 2. Categorization Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Department
                </label>
                <select
                  {...register("departmentId", { required: true })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Priority
                </label>
                <select
                  {...register("priority")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tags
                </label>
                <input
                  {...register("tags")}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="bug, feature, urgent..."
                />
              </div>
            </div>

            {/* 3. Timeline */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" /> Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate", { required: true })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    {...register("targetDate", { required: true })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Completion & Progress */}
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300 mb-1.5">
                    Actual Completion
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase text-indigo-800 dark:text-indigo-300">
                      Progress
                    </label>
                    <ProgressValue control={control} />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    {...register("progress", { valueAsNumber: true })}
                    className="w-full h-2 bg-indigo-200 dark:bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* 5. People */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" /> People
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Supporter
                  </label>
                  <input
                    {...register("supporter")}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-purple-500"
                    placeholder="Names..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    PIC Other Division
                  </label>
                  <input
                    {...register("picOtherDiv")}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:border-purple-500"
                    placeholder="Names..."
                  />
                </div>
              </div>
            </div>

            {/* 6. Milestones (Point by Point) */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Flag className="w-4 h-4 text-orange-500" /> Milestones
              </h3>

              {/* [FIX] Gunakan Controller untuk MilestoneInput */}
              <Controller
                control={control}
                name="milestones"
                render={({ field }) => (
                  <MilestoneInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* 7. Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Additional Notes
              </label>
              <textarea
                {...register("notes")}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-indigo-500 min-h-[80px]"
                placeholder="Any extra information..."
              />
            </div>

            {/* 8. Attachments */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-500" /> Attachments
              </h4>
              <AttachmentInput
                attachments={attachments}
                onChange={(newAttachments) =>
                  setValue("attachments", newAttachments, { shouldDirty: true })
                }
              />
            </div>
          </form>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex-shrink-0 px-6 py-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800 rounded-b-2xl z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-task-form"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 font-medium transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Component helper progress text
function ProgressValue({ control }: { control: Control<TaskFormValues> }) {
  const progress = useWatch({ control, name: "progress" });
  return (
    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
      {progress || 0}%
    </span>
  );
}
