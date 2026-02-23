import { useState } from "react";
import type { Task } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { EditTaskModal } from "./EditTaskModal";

type CalendarViewProps = {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  canEdit?: boolean;
};

/**
 * Calendar-based visualization of tasks.
 * Renders a standard 6-row month view and maps tasks to their respective target dates.
 */
export function CalendarView({
  tasks,
  onTaskUpdate,
  canEdit = true,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const isSameDay = (date1: Date, date2: Date) =>
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();

  const tasksForDate = (date: Date) =>
    tasks.filter((task) => {
      if (!task.targetDate) return false;
      return isSameDay(new Date(task.targetDate), date);
    });

  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Populate trailing days from the previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Populate active month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Populate leading days from the next month to maintain a consistent 42-cell grid (6 weeks)
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  /**
   * Maps task status to appropriate Tailwind CSS color classes for calendar badges.
   */
  const getTaskStyles = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-l-4 border-blue-500 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30";
      case "todo":
      default:
        return "bg-gray-100 text-gray-700 border-l-4 border-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";
    }
  };

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const handleEditTask = () => {
    setEditingTask(selectedTask);
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    onTaskUpdate(updatedTask);
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize tracking-tight">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(currentDate.getMonth() - 1);
              setCurrentDate(d);
            }}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm rounded-md transition-all"
          >
            Today
          </button>

          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(currentDate.getMonth() + 1);
              setCurrentDate(d);
            }}
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-gray-200 dark:bg-gray-700 gap-px">
          {calendarDays.map((dayInfo, index) => {
            const { date, isCurrentMonth } = dayInfo;
            const tasksForDay = tasksForDate(date);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={index}
                className={`
                  relative p-1 lg:p-2 flex flex-col gap-1 transition-colors min-h-0 overflow-hidden
                  ${
                    isCurrentMonth
                      ? "bg-white dark:bg-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/80"
                      : "bg-gray-50/80 dark:bg-gray-900/40"
                  }
                `}
              >
                <div className="flex justify-between items-start shrink-0">
                  <span
                    className={`text-xs lg:text-sm font-medium w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full transition-all ${
                      isToday
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                        : isCurrentMonth
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {tasksForDay.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 select-none px-1">
                      {tasksForDay.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto custom-scrollbar">
                  {tasksForDay.map((task) => (
                    <button
                      key={task.id}
                      onClick={(e) => handleTaskClick(e, task)}
                      className={`
                        w-full text-left px-1.5 py-1 rounded-md text-[10px] font-medium truncate shadow-sm transition-all transform hover:-translate-y-0.5 shrink-0
                        ${getTaskStyles(task.status)}
                      `}
                      title={task.title}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={onTaskUpdate}
        onEdit={canEdit ? handleEditTask : undefined}
      />

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
        />
      )}
    </div>
  );
}
