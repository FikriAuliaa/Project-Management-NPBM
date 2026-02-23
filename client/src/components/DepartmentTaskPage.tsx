import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { KanbanView } from "../components/KanbanView";
import { ListView } from "../components/ListView";
import { CalendarView } from "../components/CalendarView";
import { NewTaskModal } from "../components/NewTaskModal";
import { BatchImportModal } from "../components/BatchImportModal";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { SettingsPage } from "./SettingsPage";
import { KanbanSkeleton } from "../components/skeletons/KanbanSkeleton";
import { ListViewSkeleton } from "../components/skeletons/ListViewSkeleton";

import type { Department, Task, SortOption } from "../types";
import {
  LayoutGrid,
  List,
  Calendar,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Lock,
  CalendarDays,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useNotifications } from "../context/NotificationContext";
import { useSystemSettings } from "../hooks/useSystemSettings"; // IMPORT BARU

type DepartmentTaskPageProps = {
  idOrName?: string;
  isCombinedView?: boolean;
  onBack: () => void;
  onProfileClick?: () => void;
  onHelpClick?: () => void;
};

type ViewMode = "kanban" | "list" | "calendar";
type TimePeriodType = "all" | "year" | "half" | "quarter" | "month";

// Helper yang aman (Type-Safe) untuk mengekstrak ID
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

/**
 * Primary container for task visualization.
 * Handles layout switching (Kanban/List/Calendar), global filtering, and authorization locks.
 */
export function DepartmentTaskPage({
  idOrName,
  isCombinedView = false,
  onBack,
  onProfileClick,
  onHelpClick,
}: DepartmentTaskPageProps) {
  const navigate = useNavigate();

  const {
    tasks: allTasksData,
    departments,
    updateTask,
    createTask,
    refreshTasks,
    isLoading,
  } = useTasks();

  const { user, isManager, isAdmin } = useAuth(); // Tambahkan isAdmin
  const { addNotification } = useNotifications();
  const { settings } = useSystemSettings(); // Ambil settings dinamis

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Task["status"] | "all">(
    "all",
  );
  const [priorityFilter] = useState<Task["priority"] | "all">("all");

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("date-earliest");

  const [timePeriodType, setTimePeriodType] = useState<TimePeriodType>("all");
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear()),
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /**
   * Resolves the current department context based on URL parameters.
   */
  const currentDepartment = useMemo(() => {
    if (isCombinedView || !idOrName) return null;
    const byId = departments.find((d) => d.id === idOrName);
    if (byId) return byId;
    const decoded = decodeURIComponent(idOrName);
    return departments.find((d) => d.name === decoded);
  }, [departments, idOrName, isCombinedView]);

  const handleDepartmentSelect = (dept: Department) => {
    navigate(`/department/${dept.id}`);
    setIsMobileSidebarOpen(false);
  };

  const handleAllTasksSelect = () => {
    navigate("/all-tasks");
    setIsMobileSidebarOpen(false);
  };

  /**
   * Evaluasi Otorisasi (Permission) yang Dinamis dan Tahan Banting!
   * Mengecek apakah User boleh melakukan edit di papan (Board) yang sedang dibuka.
   */
  const hasEditPermission = useMemo(() => {
    if (isCombinedView) return isManager || isAdmin;
    if (!currentDepartment || !user) return false;
    if (isManager || isAdmin) return true;

    const userDeptId = extractDeptId(user.department);
    const userDeptNameStr = extractDeptName(user.department);

    const boardDeptId = currentDepartment.id;
    const boardDeptNameStr = currentDepartment.name;

    const globalBoardDeptId = String(
      settings["GLOBAL_BOARD_DEPT_ID"] || "NONE",
    );
    const globalManagerDeptId = String(
      settings["GLOBAL_MANAGER_DEPT_ID"] || "NONE",
    );

    const isSameDept = userDeptId === boardDeptId;
    const isGlobalBoard =
      (boardDeptId === globalBoardDeptId &&
        userDeptId === globalManagerDeptId &&
        globalBoardDeptId !== "NONE") ||
      (boardDeptNameStr === "All Dept" && userDeptNameStr === "NPC");

    return isSameDept || isGlobalBoard;
  }, [isManager, isAdmin, user, currentDepartment, isCombinedView, settings]);

  const tasks = useMemo(() => {
    if (!Array.isArray(allTasksData)) return [];
    if (isCombinedView) return allTasksData;
    if (!currentDepartment) return [];

    return allTasksData.filter((t) => {
      const taskDeptId = extractDeptId(t.department) || t.departmentId;
      return String(taskDeptId) === String(currentDepartment.id);
    });
  }, [allTasksData, isCombinedView, currentDepartment]);

  const handleTaskUpdate = (updatedTask: Task) => updateTask(updatedTask);

  const handleNewTask = async (newTaskData: Partial<Task>) => {
    try {
      if (!newTaskData.title) return;
      const taskToCreate = {
        ...newTaskData,
        departmentId: currentDepartment?.id,
      };
      await createTask(taskToCreate);
      addNotification(
        "New Task Created",
        `New task "${newTaskData.title}" added.`,
        "success",
      );
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    tasks.forEach((task) => {
      if (task.targetDate) {
        const y = new Date(task.targetDate).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [tasks]);

  const isDateInPeriod = useCallback(
    (dateStr: string): boolean => {
      if (timePeriodType === "all") return true;
      if (!dateStr) return false;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;

      const year = date.getFullYear();
      const month = date.getMonth();

      if (timePeriodType === "year") return year === parseInt(selectedYear);

      if (timePeriodType === "half") {
        if (!selectedPeriod) return true;
        const yearMatches = year === parseInt(selectedYear);
        return selectedPeriod === "H1"
          ? yearMatches && month <= 5
          : yearMatches && month >= 6;
      }

      if (timePeriodType === "quarter") {
        if (!selectedPeriod) return true;
        const yearMatches = year === parseInt(selectedYear);
        if (selectedPeriod === "Q1") return yearMatches && month <= 2;
        if (selectedPeriod === "Q2")
          return yearMatches && month >= 3 && month <= 5;
        if (selectedPeriod === "Q3")
          return yearMatches && month >= 6 && month <= 8;
        if (selectedPeriod === "Q4") return yearMatches && month >= 9;
      }

      if (timePeriodType === "month") {
        if (!selectedPeriod) return true;
        return (
          year === parseInt(selectedYear) && month === parseInt(selectedPeriod)
        );
      }
      return true;
    },
    [timePeriodType, selectedYear, selectedPeriod],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesPeriod = isDateInPeriod(task.targetDate);

      return matchesSearch && matchesStatus && matchesPriority && matchesPeriod;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, isDateInPeriod]);

  const pageTitle = isCombinedView
    ? "All Departments Overview"
    : currentDepartment
      ? `${currentDepartment.name}`
      : "Department Not Found";

  const renderContent = () => {
    if (isLoading) {
      return view === "kanban" ? (
        <KanbanSkeleton />
      ) : view === "list" ? (
        <ListViewSkeleton />
      ) : (
        <div className="p-8 text-center text-slate-500">
          Loading Calendar...
        </div>
      );
    }

    if (
      filteredTasks.length === 0 &&
      !searchQuery &&
      statusFilter === "all" &&
      timePeriodType === "all"
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50 m-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
            <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No tasks found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2 mb-6">
            {currentDepartment
              ? "Get started by creating a new task to track progress."
              : "No tasks available matching your filters."}
          </p>
          {hasEditPermission && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
            >
              Create New Task
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="min-h-[500px] h-full">
        {view === "kanban" && (
          <KanbanView
            tasks={filteredTasks}
            sortOption={sortOption}
            canEdit={!!hasEditPermission}
          />
        )}
        {view === "list" && (
          <div className="h-full px-4 md:px-6">
            <ListView
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              sortOption={sortOption}
              canEdit={!!hasEditPermission}
            />
          </div>
        )}
        {view === "calendar" && (
          <div className="h-full px-4 md:px-6">
            <CalendarView
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              canEdit={!!hasEditPermission}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 font-sans">
      <div className="hidden md:flex flex-shrink-0 z-30">
        <Sidebar
          selectedDepartment={currentDepartment || null}
          onDepartmentSelect={handleDepartmentSelect}
          onAllTasksSelect={handleAllTasksSelect}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onProfileClick={onProfileClick}
        />
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 animate-in slide-in-from-left duration-200 shadow-2xl">
            <Sidebar
              selectedDepartment={currentDepartment || null}
              onDepartmentSelect={handleDepartmentSelect}
              onAllTasksSelect={handleAllTasksSelect}
              onSettingsClick={() => setIsSettingsOpen(true)}
              onProfileClick={onProfileClick}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Navbar
          onSettingsClick={() => setIsSettingsOpen(true)}
          onProfileClick={onProfileClick}
          onHelpClick={onHelpClick}
          showLogo={false}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:shadow-sm transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {isLoading ? (
                        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg" />
                      ) : (
                        pageTitle
                      )}
                    </h1>
                    {/* INDIKATOR READ ONLY SUDAH DINAMIS DI SINI */}
                    {!hasEditPermission && !isLoading && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3 h-3" /> Read-only
                      </span>
                    )}
                  </div>
                  {!isLoading && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {filteredTasks.length}{" "}
                      {filteredTasks.length === 1 ? "task" : "tasks"} found
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasEditPermission && (
                  <button
                    onClick={() => setIsBatchImportOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm text-sm font-medium h-10"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                )}
                {hasEditPermission ? (
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all text-sm font-bold h-10"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New Task</span>
                    <span className="sm:hidden">New</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl cursor-not-allowed text-sm font-medium h-10 border border-transparent"
                  >
                    <Lock className="w-4 h-4" /> New Task
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 xl:pb-0">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-shrink-0">
                  {[
                    { id: "kanban", icon: LayoutGrid },
                    { id: "list", icon: List },
                    { id: "calendar", icon: Calendar },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setView(mode.id as ViewMode)}
                      className={`p-1.5 rounded-lg transition-all ${
                        view === mode.id
                          ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                      title={
                        mode.id.charAt(0).toUpperCase() +
                        mode.id.slice(1) +
                        " View"
                      }
                    >
                      <mode.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

                <div className="relative flex-shrink-0">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 z-10" />
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as Task["status"] | "all")
                    }
                    className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <option value="all">All Status</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 shadow-sm flex-shrink-0 h-[38px]">
                  <CalendarDays className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
                  <select
                    value={timePeriodType}
                    onChange={(e) => {
                      setTimePeriodType(e.target.value as TimePeriodType);
                      setSelectedPeriod("");
                    }}
                    className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer py-2 pr-2"
                  >
                    <option value="all">All Time</option>
                    <option value="year">Year</option>
                    <option value="half">Half</option>
                    <option value="quarter">Quarter</option>
                    <option value="month">Month</option>
                  </select>

                  {timePeriodType !== "all" && (
                    <>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer py-2 pl-2"
                      >
                        {availableYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {(timePeriodType === "half" ||
                    timePeriodType === "quarter" ||
                    timePeriodType === "month") && (
                    <>
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer py-2 pl-2 max-w-[100px]"
                      >
                        <option value="">All</option>
                        {timePeriodType === "half" && (
                          <>
                            <option value="H1">H1</option>
                            <option value="H2">H2</option>
                          </>
                        )}
                        {timePeriodType === "quarter" && (
                          <>
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                          </>
                        )}
                        {timePeriodType === "month" &&
                          Array.from({ length: 12 }).map((_, i) => (
                            <option key={i} value={i}>
                              {new Date(0, i).toLocaleString("default", {
                                month: "short",
                              })}
                            </option>
                          ))}
                      </select>
                    </>
                  )}
                </div>

                {(view === "kanban" || view === "list") && (
                  <div className="relative flex-shrink-0">
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 z-10" />
                    <select
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      className="pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <option value="custom">Custom</option>
                      <option value="date-earliest">Earliest Due</option>
                      <option value="date-latest">Latest Due</option>
                      <option value="priority-high">High Priority</option>
                      <option value="priority-low">Low Priority</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950">
          {renderContent()}
        </main>
      </div>

      {isNewTaskModalOpen && (
        <NewTaskModal
          isOpen={true}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSubmit={handleNewTask}
          defaultDepartment={currentDepartment?.id || ""}
        />
      )}

      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        onSuccess={() => {
          refreshTasks();
          addNotification(
            "Import Success",
            "Data Excel berhasil diimport.",
            "success",
          );
        }}
        defaultDepartment={currentDepartment?.id || ""}
      />

      {isSettingsOpen && (
        <SettingsPage onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
