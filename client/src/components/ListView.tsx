import { useState, useMemo, Fragment } from "react";
import type { Task, SortOption } from "../types";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { EditTaskModal } from "./EditTaskModal";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { useSystemSettings } from "../hooks/useSystemSettings";
import {
  Circle,
  Clock3,
  CheckCircle2,
  Edit2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Paperclip,
  MessageSquare,
  Trash2,
} from "lucide-react";

type ListViewProps = {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  sortOption: SortOption;
  canEdit?: boolean;
};

type TaskRowProps = {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  canEdit: boolean;
};

const ITEMS_PER_PAGE = 15;

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

const calculateDuration = (startDate: string, targetDate: string) => {
  if (!startDate || !targetDate) return 0;
  const start = new Date(startDate);
  const target = new Date(targetDate);
  const diff = target.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export function ListView({ tasks, sortOption, canEdit = true }: ListViewProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user: authUser, isManager, isAdmin } = useAuth();
  const { settings } = useSystemSettings();

  const userDeptId = String(
    authUser?.departmentId || extractDeptId(authUser?.department),
  );
  const userDeptNameStr = extractDeptName(authUser?.department);

  const globalBoardDeptId = String(settings["GLOBAL_BOARD_DEPT_ID"] || "NONE");
  const globalManagerDeptId = String(
    settings["GLOBAL_MANAGER_DEPT_ID"] || "NONE",
  );

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set<string>(),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    switch (sortOption) {
      case "priority-high":
        return sorted.sort((a, b) => {
          const p: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (p[b.priority] || 0) - (p[a.priority] || 0);
        });
      case "priority-low":
        return sorted.sort((a, b) => {
          const p: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (p[a.priority] || 0) - (p[b.priority] || 0);
        });
      case "date-earliest":
        return sorted.sort(
          (a, b) =>
            new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
        );
      case "date-latest":
        return sorted.sort(
          (a, b) =>
            new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime(),
        );
      case "progress-high":
        return sorted.sort((a, b) => b.progress - a.progress);
      case "progress-low":
        return sorted.sort((a, b) => a.progress - b.progress);
      case "title-asc":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "title-desc":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [tasks, sortOption]);

  const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE) || 1;
  const currentTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTasks, currentPage]);

  const toggleRowExpansion = (taskId: string) => {
    setExpandedRows((prev) => {
      const next = new Set<string>(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const getModalCanEdit = (t: Task | null) => {
    if (!t) return false;
    const tDeptId = String(t.departmentId || extractDeptId(t.department));
    const tDeptNameStr = extractDeptName(t.department);

    const hasDyn =
      isAdmin ||
      isManager ||
      (tDeptId === globalBoardDeptId &&
        userDeptId === globalManagerDeptId &&
        globalBoardDeptId !== "NONE") ||
      (tDeptNameStr === "All Dept" && userDeptNameStr === "NPC") ||
      (userDeptId === tDeptId && tDeptId !== "");

    return canEdit || hasDyn;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-220px)]">
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="w-10 px-2 py-3 sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"></th>
              <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase sticky left-10 z-30 bg-gray-50 dark:bg-gray-700 border-b shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Task
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Department
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Status
              </th>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Supporter
              </th>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                PIC
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Start
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Target
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Duration
              </th>
              <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase border-b border-gray-200 dark:border-gray-600">
                Progress
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase sticky right-0 z-30 bg-gray-50 dark:bg-gray-700 border-b shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-gray-200 dark:border-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {currentTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isExpanded={expandedRows.has(task.id)}
                onToggleExpand={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(task.id);
                }}
                onClick={() => {
                  setSelectedTask(task);
                  setIsDetailsModalOpen(true);
                }}
                onEdit={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                  setIsEditModalOpen(true);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure?")) deleteTask(task.id);
                }}
                canEdit={getModalCanEdit(task)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onUpdateTask={updateTask}
        onEdit={() => {
          setIsDetailsModalOpen(false);
          setIsEditModalOpen(true);
        }}
        userCanEdit={getModalCanEdit(selectedTask)}
      />

      {isEditModalOpen && (
        <EditTaskModal
          key={selectedTask?.id}
          task={selectedTask}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(t) => {
            updateTask(t);
            setIsEditModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}

      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing{" "}
            <span className="font-medium">
              {tasks.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, tasks.length)}
            </span>{" "}
            of <span className="font-medium">{tasks.length}</span> results
          </p>
          <nav className="inline-flex shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50"
            >
              <ChevronsLeft className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <span className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-medium dark:text-gray-200">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50"
            >
              <ChevronsRight className="h-5 w-5 text-gray-400" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  isExpanded,
  onToggleExpand,
  onClick,
  onEdit,
  onDelete,
  canEdit,
}: TaskRowProps) {
  const StatusIcon =
    task.status === "todo"
      ? Circle
      : task.status === "in_progress"
        ? Clock3
        : CheckCircle2;
  const duration = calculateDuration(task.startDate, task.targetDate);
  const attachmentCount = task.attachments?.length || 0;
  const commentsCount = task.comments?.length || 0;
  const deptName =
    extractDeptName(task.department) || String(task.department || "-");

  return (
    <Fragment>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
        onClick={onClick}
      >
        <td
          className="px-2 py-3 sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 border-b border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </td>
        <td className="px-4 py-3 sticky left-10 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 border-b border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
          <div
            className="font-medium text-gray-900 dark:text-gray-100 truncate w-48"
            title={task.title}
          >
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {attachmentCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border dark:border-gray-600">
                <Paperclip className="w-3 h-3" /> {attachmentCount}
              </div>
            )}
            {commentsCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border dark:border-blue-800">
                <MessageSquare className="w-3 h-3" /> {commentsCount}
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="px-2.5 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 truncate">
            {deptName}
          </span>
        </td>
        <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={`w-4 h-4 ${task.status === "todo" ? "text-gray-400" : task.status === "in_progress" ? "text-orange-500" : "text-green-500"}`}
            />
            <span className="text-xs dark:text-gray-300">
              {task.status.replace("_", " ")}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm truncate border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
          {task.supporter}
        </td>
        <td className="px-4 py-3 text-sm truncate border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
          {task.picOtherDiv}
        </td>
        <td className="px-4 py-3 text-xs whitespace-nowrap border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
          {task.startDate ? new Date(task.startDate).toLocaleDateString() : "-"}
        </td>
        <td className="px-4 py-3 text-xs whitespace-nowrap border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
          {task.targetDate
            ? new Date(task.targetDate).toLocaleDateString()
            : "-"}
        </td>
        <td className="px-4 py-3 text-sm text-center border-b border-gray-200 dark:border-gray-700 dark:text-gray-300">
          {duration}d
        </td>
        <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 min-w-[50px]">
              <div
                className={`h-2 rounded-full ${task.progress === 100 ? "bg-green-500" : "bg-orange-500"}`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs font-medium dark:text-gray-300">
              {task.progress}%
            </span>
          </div>
        </td>
        <td
          className="px-4 py-3 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 border-b border-gray-200 dark:border-gray-700 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-900/50">
          <td
            colSpan={2}
            className="sticky left-0 bg-gray-50 dark:bg-gray-900/50 z-10 border-b border-gray-200 dark:border-gray-700"
          ></td>
          <td
            colSpan={9}
            className="px-4 py-4 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">
                  Description
                </div>
                <div className="text-sm dark:text-gray-300">
                  {task.description || "-"}
                </div>
              </div>
              {task.notes && (
                <div>
                  <div className="text-xs text-gray-500 uppercase">Notes</div>
                  <div className="text-sm whitespace-pre-wrap dark:text-gray-300">
                    {task.notes}
                  </div>
                </div>
              )}
              {canEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Edit Task
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}
