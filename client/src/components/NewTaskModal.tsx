import { useEffect } from "react";
import { useForm, useWatch, type Control, Controller } from "react-hook-form";
import type { Task, Attachment } from "../types";
import {
  X,
  Calendar,
  Flag,
  Hash,
  User,
  Briefcase,
  Target,
  ListTodo,
  Paperclip,
  Activity,
} from "lucide-react";
import { AttachmentInput } from "./AttachmentInput";
import { MilestoneInput } from "./MilestoneInput";
import { useTasks } from "../context/TasksContext";

type NewTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  defaultDepartment?: string;
  initialData?: Task | null;
  mode?: "create" | "edit";
};

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

const formatDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

/**
 * Shared styling constants for form inputs to maintain UI consistency
 * and reduce JSX clutter.
 */
const inputClass =
  "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400";
const labelClass =
  "flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

/**
 * Multi-purpose modal component for creating and editing tasks.
 * Implements react-hook-form for state management and bi-directional syncing
 * between related fields (e.g., Status and Progress).
 */
export function NewTaskModal({
  isOpen,
  onClose,
  onSubmit,
  defaultDepartment = "",
  initialData,
  mode = "create",
}: NewTaskModalProps) {
  const { departments } = useTasks();
  const isEdit = mode === "edit" && !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: {
      title: "",
      description: "",
      departmentId: defaultDepartment,
      status: "todo",
      priority: "medium",
      tags: "",
      startDate: new Date().toISOString().split("T")[0],
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

  const attachments = useWatch({ control, name: "attachments" }) || [];
  const watchedStatus = useWatch({ control, name: "status" });
  const watchedProgress = useWatch({ control, name: "progress" });

  /**
   * Bi-directional Sync: Status -> Progress
   * Automatically updates the progress slider when the status dropdown changes.
   * Utilizes getValues() to read current progress without adding it to the dependency array,
   * preventing infinite re-rendering loops.
   */
  useEffect(() => {
    const currentProgress = Number(getValues("progress") || 0);

    if (watchedStatus === "done" && currentProgress !== 100) {
      setValue("progress", 100);
    } else if (watchedStatus === "todo" && currentProgress !== 0) {
      setValue("progress", 0);
    } else if (watchedStatus === "in_progress") {
      // Only reset to 50% if transitioning from extreme ends (0 or 100).
      // This preserves manual slider adjustments made by the user.
      if (currentProgress === 0 || currentProgress === 100) {
        setValue("progress", 50);
      }
    }
  }, [watchedStatus, setValue, getValues]);

  /**
   * Bi-directional Sync: Progress -> Status
   * Automatically updates the status dropdown when the progress slider is adjusted.
   */
  useEffect(() => {
    const currentStatus = getValues("status");
    const p = Number(watchedProgress || 0);

    if (p === 100 && currentStatus !== "done") {
      setValue("status", "done");
    } else if (p === 0 && currentStatus !== "todo") {
      setValue("status", "todo");
    } else if (p > 0 && p < 100 && currentStatus !== "in_progress") {
      setValue("status", "in_progress");
    }
  }, [watchedProgress, setValue, getValues]);

  /**
   * Form Hydration
   * Populates the form with existing task data when opened in 'edit' mode.
   */
  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) {
        let initialDeptId = defaultDepartment;

        // Safely extract department ID regardless of payload structure
        if (initialData.department) {
          if (
            typeof initialData.department === "object" &&
            "id" in initialData.department
          ) {
            initialDeptId = (initialData.department as { id: string }).id;
          } else if (typeof initialData.department === "string") {
            initialDeptId = initialData.department;
          }
        } else if (initialData.departmentId) {
          initialDeptId = initialData.departmentId;
        }

        reset({
          title: initialData.title || "",
          description: initialData.description || "",
          departmentId: initialDeptId,
          status: initialData.status || "todo",
          priority: initialData.priority || "medium",
          tags: Array.isArray(initialData.tags)
            ? initialData.tags.join(", ")
            : "",
          startDate: formatDate(initialData.startDate),
          targetDate: formatDate(initialData.targetDate),
          dueDate: formatDate(initialData.dueDate),
          supporter: initialData.supporter || "",
          picOtherDiv: initialData.picOtherDiv || "",
          milestones: initialData.milestones || "",
          notes: initialData.notes || "",
          progress: initialData.progress || 0,
          attachments: initialData.attachments || [],
        });
      } else {
        reset({
          title: "",
          description: "",
          departmentId: defaultDepartment,
          status: "todo",
          priority: "medium",
          tags: "",
          startDate: new Date().toISOString().split("T")[0],
          targetDate: "",
          dueDate: "",
          supporter: "",
          picOtherDiv: "",
          milestones: "",
          notes: "",
          progress: 0,
          attachments: [],
        });
      }
    }
  }, [isOpen, isEdit, initialData, defaultDepartment, reset]);

  const onFormSubmit = (data: TaskFormValues) => {
    const { tags, ...restData } = data;

    // Construct final payload
    const taskData: Partial<Task> = {
      ...(isEdit ? { id: initialData?.id } : {}),
      ...restData,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dueDate: data.dueDate ? data.dueDate : undefined,
    };

    onSubmit(taskData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {isEdit ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fill in the details below to manage your project timeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form id="task-form" onSubmit={handleSubmit(onFormSubmit)}>
            {/* Main Info */}
            <div className="p-6 space-y-5">
              <div>
                <input
                  {...register("title", { required: true })}
                  className="w-full text-xl font-bold bg-transparent border-0 border-b-2 border-slate-100 dark:border-slate-700 px-0 py-2 focus:ring-0 focus:border-blue-500 placeholder:text-slate-300 dark:text-white transition-colors"
                  placeholder="What needs to be done?"
                  autoFocus
                />
                {errors.title && (
                  <span className="text-xs text-red-500 mt-1 block">
                    Title is required
                  </span>
                )}
              </div>

              <div>
                <textarea
                  {...register("description")}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-0 rounded-lg px-4 py-3 text-sm text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-blue-500/50 min-h-[80px] resize-none"
                  placeholder="Add a more detailed description..."
                />
              </div>
            </div>

            {/* Meta Data Box */}
            <div className="bg-slate-50/80 dark:bg-slate-900/30 px-6 py-6 border-y border-slate-100 dark:border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className={labelClass}>
                    <Briefcase className="w-3.5 h-3.5" /> Department
                  </label>
                  <select
                    {...register("departmentId", { required: true })}
                    className={inputClass}
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
                  <label className={labelClass}>
                    <Flag className="w-3.5 h-3.5" /> Priority
                  </label>
                  <select {...register("priority")} className={inputClass}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    <Activity className="w-3.5 h-3.5" /> Status
                  </label>
                  <select {...register("status")} className={inputClass}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    <Hash className="w-3.5 h-3.5" /> Tags
                  </label>
                  <input
                    {...register("tags")}
                    className={inputClass}
                    placeholder="e.g. Q1, Marketing"
                  />
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>
                    <Calendar className="w-3.5 h-3.5" /> Start Date
                  </label>
                  <input
                    type="date"
                    {...register("startDate", { required: true })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Target className="w-3.5 h-3.5" /> Target Date
                  </label>
                  <input
                    type="date"
                    {...register("targetDate", { required: true })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Calendar className="w-3.5 h-3.5" /> Actual Due
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Personnel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <User className="w-3.5 h-3.5" /> Supporter
                  </label>
                  <input
                    {...register("supporter")}
                    className={inputClass}
                    placeholder="Who is helping?"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <User className="w-3.5 h-3.5" /> PIC Other Div
                  </label>
                  <input
                    {...register("picOtherDiv")}
                    className={inputClass}
                    placeholder="External PIC"
                  />
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelClass}>
                    <Activity className="w-3.5 h-3.5" /> Progress
                  </label>
                  <ProgressValue control={control} />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  {...register("progress", { valueAsNumber: true })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                />
              </div>

              <hr className="border-slate-100 dark:border-slate-700" />

              {/* Milestones */}
              <div>
                <label className={`${labelClass} mb-3`}>
                  <ListTodo className="w-3.5 h-3.5" /> Milestones / Steps
                </label>
                <div className="bg-slate-50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
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
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  {...register("notes")}
                  className={`${inputClass} min-h-[60px]`}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Attachments */}
              <div>
                <label className={`${labelClass} mb-2`}>
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </label>
                <AttachmentInput
                  attachments={attachments}
                  onChange={(newAttachments) =>
                    setValue("attachments", newAttachments, {
                      shouldDirty: true,
                    })
                  }
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-600/20 transition-all transform active:scale-95"
          >
            {isEdit ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper component to display dynamic progress percentage
 */
function ProgressValue({ control }: { control: Control<TaskFormValues> }) {
  const progress = useWatch({ control, name: "progress" });
  return (
    <span
      className={`text-xs font-bold px-2 py-0.5 rounded ${
        progress === 100
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      }`}
    >
      {progress || 0}%
    </span>
  );
}
