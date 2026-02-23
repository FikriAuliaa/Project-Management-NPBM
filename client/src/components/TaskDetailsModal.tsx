import { useState } from "react";
import type { Task, Comment as TaskComment } from "../types";
import { useAuth } from "../context/AuthContext";
import { useSystemSettings } from "../hooks/useSystemSettings";
import { api } from "../services/api";
import toast from "react-hot-toast";
import {
  X,
  User,
  Edit,
  Link2,
  FileText as FileTextIcon,
  Calendar as CalendarIcon,
  Send,
  MessageSquare,
  Flag,
  Lock,
  Paperclip,
  Loader2,
} from "lucide-react";

type TaskDetailsModalProps = {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (task: Task) => void;
  onEdit?: () => void;
  userCanEdit?: boolean;
};

const extractDeptId = (deptObj: unknown): string => {
  if (!deptObj) return "";
  if (typeof deptObj === "string") return deptObj;
  if (typeof deptObj === "object" && "id" in deptObj) {
    return String((deptObj as { id: string }).id);
  }
  return "";
};

const extractDeptName = (deptObj: unknown): string => {
  if (typeof deptObj === "object" && deptObj !== null && "name" in deptObj) {
    return String((deptObj as { name: string }).name);
  }
  return "";
};

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onEdit,
  onUpdateTask,
  userCanEdit,
}: TaskDetailsModalProps) {
  const { currentUser, user: authUser, isManager, isAdmin } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { settings } = useSystemSettings();

  if (!isOpen || !task) return null;

  // 1. Ekstrak Data User & Task
  const userDeptId = String(
    authUser?.departmentId || extractDeptId(authUser?.department),
  );
  const taskDeptId = String(
    task.departmentId || extractDeptId(task.department),
  );

  const userDeptNameStr = extractDeptName(authUser?.department);
  const taskDeptNameStr = extractDeptName(task.department);

  // 2. Data Dynamic dari Database
  const globalBoardDeptId = String(settings["GLOBAL_BOARD_DEPT_ID"] || "NONE");
  const globalManagerDeptId = String(
    settings["GLOBAL_MANAGER_DEPT_ID"] || "NONE",
  );

  // 3. DOUBLE VALIDATION (Sangat Aman)
  const isSameDept = userDeptId === taskDeptId && taskDeptId !== "";

  // Lolos jika ID cocok (Dynamic Settings) ATAU Nama cocok (Static Fallback jaring pengaman)
  const isGlobalAccess =
    (taskDeptId === globalBoardDeptId &&
      userDeptId === globalManagerDeptId &&
      globalBoardDeptId !== "NONE") ||
    (taskDeptNameStr === "All Dept" && userDeptNameStr === "NPC");

  const hasAccess = isAdmin || isManager || isSameDept || isGlobalAccess;

  // Jika parent bilang BISA atau logic lokal bilang BISA = BISA EDIT!
  const canEdit = userCanEdit || hasAccess;

  const taskDeptNameDisplay = taskDeptNameStr || String(task.department || "-");

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    try {
      setIsSubmitting(true);
      const username = currentUser || "User";
      const savedComment: TaskComment = await api.addComment(
        task.id,
        newComment,
        username,
      );

      if (onUpdateTask) {
        const currentComments = (task.comments || []) as TaskComment[];
        onUpdateTask({ ...task, comments: [savedComment, ...currentComments] });
      }

      setNewComment("");
      toast.success("Komentar terkirim");
    } catch (error) {
      console.error("Comment Error:", error);
      toast.error("Gagal mengirim komentar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col border border-slate-200 dark:border-slate-700">
        <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Task Details
            </h2>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider ${task.status === "done" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : task.status === "in_progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}
            >
              {task.status.replace("_", " ")}
            </span>
            {!canEdit && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                <Lock className="w-3 h-3" /> Read Only
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {taskDeptNameDisplay}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${task.priority === "high" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : task.priority === "medium" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}
              >
                {task.priority} Priority
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 leading-snug">
              {task.title}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Description / Notes
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {task.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-semibold">
                <CalendarIcon className="w-4 h-4 text-blue-500" /> Timeline
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Date:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {task.targetDate
                      ? new Date(task.targetDate).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                {task.status === "done" && task.dueDate && (
                  <div className="flex justify-between font-bold text-green-600 dark:text-green-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span>Completed:</span>
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-semibold">
                <User className="w-4 h-4 text-purple-500" /> People
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Supporter</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded border border-slate-100 dark:border-slate-700">
                    {task.supporter || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    PIC Other Div
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1 rounded border border-slate-100 dark:border-slate-700">
                    {task.picOtherDiv || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Progress
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {task.progress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>

          {task.milestones && (
            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center gap-2 mb-2 font-bold text-purple-800 dark:text-purple-300 text-sm">
                <Flag className="w-4 h-4" /> Milestones
              </div>
              <p className="text-sm text-purple-900 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
                {task.milestones}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-500" /> Attachments
            </h4>
            {task.attachments && task.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {task.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                      {att.type === "file" ? (
                        <FileTextIcon className="w-5 h-5" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {att.name || "Attachment"}
                      </div>
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                        Click to open
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm">
                No attachments uploaded yet.
              </div>
            )}
          </div>

          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" /> Discussion
            </h3>

            <div className="space-y-4 mb-6">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {(comment.user || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {comment.user}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString()}{" "}
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    No comments yet. Start the discussion!
                  </p>
                </div>
              )}
            </div>

            {onUpdateTask ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  disabled={isSubmitting || !canEdit}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting || !canEdit}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[56px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs text-center rounded-lg border border-yellow-200 dark:border-yellow-800">
                You cannot add comments in Read-Only mode.
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 z-10 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors"
          >
            Close
          </button>
          {onEdit && canEdit && (
            <button
              onClick={onEdit}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 font-medium shadow-md transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
