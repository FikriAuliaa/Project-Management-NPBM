import { useState, useMemo, memo, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { useSystemSettings } from "../hooks/useSystemSettings";
import type {
  Task,
  Status,
  SortOption,
  Comment as TaskComment,
} from "../types";
import {
  Calendar,
  Lock,
  MessageSquare,
  Paperclip,
  GripVertical,
  Trash2,
} from "lucide-react";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { EditTaskModal } from "./EditTaskModal";
import toast from "react-hot-toast";

type KanbanViewProps = {
  tasks: Task[];
  sortOption: SortOption;
  canEdit?: boolean;
};

type KanbanCardProps = {
  task: Task;
  index: number;
  isDragDisabled: boolean;
  showDragHandle: boolean;
  onClick: (task: Task) => void;
  onDelete: (taskId: string) => void;
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

const getSortedTasks = (tasks: Task[], sortOption: SortOption): Task[] => {
  if (sortOption === "custom") return tasks;
  const sorted = [...tasks];
  switch (sortOption) {
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
    case "progress-high":
      return sorted.sort((a, b) => b.progress - a.progress);
    case "progress-low":
      return sorted.sort((a, b) => a.progress - b.progress);
    default:
      return sorted;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30";
    case "medium":
      return "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30";
    default:
      return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30";
  }
};

const KanbanCard = memo(
  ({
    task,
    index,
    isDragDisabled,
    showDragHandle,
    onClick,
    onDelete,
  }: KanbanCardProps) => {
    const deptNameStr = extractDeptName(task.department);
    const deptName = deptNameStr || String(task.department || "");
    const commentsCount = task.comments?.length || 0;
    const attachmentsCount = task.attachments?.length || 0;
    const isOverdue =
      new Date(task.targetDate) < new Date() && task.status !== "done";

    const recentComments = (task.comments || []).slice(0, 3) as TaskComment[];
    const moreComments = commentsCount - 3;
    const progressValue = task.progress || 0;

    return (
      <Draggable
        draggableId={task.id}
        index={index}
        isDragDisabled={isDragDisabled}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
            className="pb-3" // Menghindari glitch animasi dari margin
          >
            <div
              onClick={() => onClick(task)}
              className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 group relative transition-colors duration-200 ${
                snapshot.isDragging
                  ? "shadow-2xl ring-2 ring-blue-500/50 scale-[1.02] rotate-1 z-50 cursor-grabbing bg-blue-50/50 dark:bg-gray-700"
                  : "shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500"
              } ${isDragDisabled ? "cursor-pointer" : "cursor-grab"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight truncate max-w-[80px] pt-0.5">
                    {deptName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {!isDragDisabled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isDragDisabled ? (
                    <Lock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                  ) : (
                    showDragHandle && (
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-1" />
                    )
                  )}
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {task.title}
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressValue === 100 ? "bg-green-500" : "bg-blue-500"}`}
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 min-w-[28px] text-right">
                  {progressValue}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50">
                <div
                  className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(task.targetDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {task.supporter && (
                    <div
                      className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300"
                      title={`Supporter: ${task.supporter}`}
                    >
                      {task.supporter.charAt(0)}
                    </div>
                  )}

                  {/* Tooltip Komentar */}
                  <div className="relative group/tooltip flex items-center gap-1 cursor-help">
                    <div
                      className={`flex items-center gap-1 transition-colors ${commentsCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">
                        {commentsCount}
                      </span>
                    </div>
                    {commentsCount > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-gray-900/95 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-[60] backdrop-blur-sm transform scale-95 group-hover/tooltip:scale-100 origin-bottom">
                        <div className="font-semibold mb-1 text-gray-300 text-[10px] uppercase">
                          Latest Comments
                        </div>
                        <div className="space-y-2">
                          {recentComments.map((c, i) => (
                            <div
                              key={i}
                              className="text-gray-100 bg-gray-800/50 p-1.5 rounded border border-gray-700/50 italic"
                            >
                              "{c.text}"
                            </div>
                          ))}
                          {moreComments > 0 && (
                            <div className="text-[10px] text-gray-400 text-center pt-1 border-t border-gray-700">
                              + {moreComments} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tooltip Attachment */}
                  <div className="relative group/tooltip flex items-center gap-1 cursor-help">
                    <div
                      className={`flex items-center gap-1 transition-colors ${attachmentsCount > 0 ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">
                        {attachmentsCount}
                      </span>
                    </div>
                    {attachmentsCount > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-900/95 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 pointer-events-none z-[60] backdrop-blur-sm">
                        {attachmentsCount} Files Attached
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  },
);

export function KanbanView({
  tasks,
  sortOption,
  canEdit = false,
}: KanbanViewProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user: authUser, isManager, isAdmin } = useAuth();
  const { settings } = useSystemSettings();

  // Optimistic UI State
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const userDeptId = String(
    authUser?.departmentId || extractDeptId(authUser?.department),
  );
  const userDeptNameStr = extractDeptName(authUser?.department);

  const globalBoardDeptId = String(settings["GLOBAL_BOARD_DEPT_ID"] || "NONE");
  const globalManagerDeptId = String(
    settings["GLOBAL_MANAGER_DEPT_ID"] || "NONE",
  );

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sortedTasks = useMemo(
    () => getSortedTasks(localTasks, sortOption),
    [localTasks, sortOption],
  );

  const columns: { id: Status; title: string }[] = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ];

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
    }
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

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;
    if (
      destination.droppableId === source.droppableId &&
      sortOption !== "custom"
    ) {
      toast("Switch to 'Custom' to reorder manually.", {
        icon: "🔒",
        style: { fontSize: "12px" },
      });
      return;
    }

    const task = localTasks.find((t) => t.id === draggableId);
    if (!task) return;

    if (!getModalCanEdit(task)) return;

    const newStatus = destination.droppableId as Status;
    let newProgress = task.progress;

    if (source.droppableId !== destination.droppableId) {
      if (newStatus === "todo") newProgress = 0;
      else if (newStatus === "done") newProgress = 100;
      else if (newStatus === "in_progress" && task.progress === 0)
        newProgress = 50;
      else if (newStatus === "in_progress" && task.progress === 100)
        newProgress = 90;
    }

    // Update lokal secara instan
    setLocalTasks((prev) => {
      const updatedTasks = prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, progress: newProgress }
          : t,
      );

      if (
        source.droppableId === destination.droppableId &&
        sortOption === "custom"
      ) {
        const colTasks = updatedTasks.filter(
          (t) => t.status === source.droppableId,
        );
        const movedTask = colTasks[source.index];
        colTasks.splice(source.index, 1);
        colTasks.splice(destination.index, 0, movedTask);
        return [
          ...updatedTasks.filter((t) => t.status !== source.droppableId),
          ...colTasks,
        ];
      }
      return updatedTasks;
    });

    // Update ke database
    updateTask({ ...task, status: newStatus, progress: newProgress });
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
          {columns.map((col) => {
            const colTasks = sortedTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]"
              >
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    {col.title}{" "}
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full">
                      {colTasks.length}
                    </span>
                  </h3>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 flex flex-col min-h-[100px] rounded-xl transition-colors duration-200 ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      {colTasks.map((task, index) => {
                        return (
                          <KanbanCard
                            key={task.id}
                            task={task}
                            index={index}
                            isDragDisabled={!getModalCanEdit(task)}
                            showDragHandle={sortOption === "custom"}
                            onClick={setSelectedTask}
                            onDelete={handleDeleteTask}
                          />
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={updateTask}
        onEdit={() => {
          setEditingTask(selectedTask);
          setSelectedTask(null);
        }}
        userCanEdit={getModalCanEdit(selectedTask)}
      />

      {editingTask && (
        <EditTaskModal
          key={editingTask.id}
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(t) => {
            updateTask(t);
            setEditingTask(null);
          }}
        />
      )}
    </>
  );
}
