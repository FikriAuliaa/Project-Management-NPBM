import type { Task } from "../types";
import {
  ArrowRight,
  CalendarDays,
  Plus,
  Layers,
  Activity,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users, // Import icon Users
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SettingsPage } from "./SettingsPage";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ExportButton } from "../components/ExportButton";
import { api } from "../services/api";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type HomePageProps = {
  onProfileClick?: () => void;
  onHelpClick?: () => void;
};

type TimePeriodType = "all" | "year" | "half" | "quarter" | "month";

/**
 * Predefined set of Tailwind border color classes.
 */
const COLORS = [
  "border-blue-500",
  "border-purple-500",
  "border-green-500",
  "border-red-500",
  "border-orange-500",
  "border-indigo-500",
  "border-pink-500",
  "border-teal-500",
];

/**
 * Generates a consistent color for a department based on its name using a simple string hashing algorithm.
 * Ensures the same department always gets the same visual identifier across re-renders.
 */
const getBorderColorClass = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

/**
 * Primary Dashboard Component.
 * Aggregates data across all departments to provide high-level metrics, charts, and navigation.
 */
export function HomePage({ onProfileClick, onHelpClick }: HomePageProps) {
  const navigate = useNavigate();
  // Tarik juga isAdmin dari AuthContext
  const { isManager, isAdmin } = useAuth();

  const {
    getTaskStats,
    getAllTaskStats,
    tasks,
    departments,
    refreshTasks,
    refreshDepartments,
  } = useTasks();

  const navigateToDept = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (dept) navigate(`/department/${encodeURIComponent(dept.name)}`);
  };

  const navigateToAll = () => {
    navigate("/all-tasks");
  };

  const [timePeriodType, setTimePeriodType] = useState<TimePeriodType>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] =
    useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /**
   * Core filtering logic to determine if a task's target date falls within the globally selected time period.
   */
  const isDateInPeriod = useCallback(
    (dateStr: string | null | undefined): boolean => {
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
        if (selectedPeriod === "H1") return yearMatches && month <= 5;
        else if (selectedPeriod === "H2") return yearMatches && month >= 6;
      }
      if (timePeriodType === "quarter") {
        if (!selectedPeriod) return true;
        const yearMatches = year === parseInt(selectedYear);
        if (selectedPeriod === "Q1") return yearMatches && month <= 2;
        else if (selectedPeriod === "Q2")
          return yearMatches && month >= 3 && month <= 5;
        else if (selectedPeriod === "Q3")
          return yearMatches && month >= 6 && month <= 8;
        else if (selectedPeriod === "Q4") return yearMatches && month >= 9;
      }
      if (timePeriodType === "month") {
        if (!selectedPeriod) return true;
        const yearMatches = year === parseInt(selectedYear);
        const monthMatches = month === parseInt(selectedPeriod);
        return yearMatches && monthMatches;
      }
      return true;
    },
    [timePeriodType, selectedYear, selectedPeriod],
  );

  /**
   * Dynamically extracts all unique years present in the dataset to populate the year filter dropdown.
   */
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    tasks.forEach((task: Task) => {
      if (task.targetDate) {
        const d = new Date(task.targetDate);
        if (!isNaN(d.getTime())) years.add(d.getFullYear());
      }
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(String);
  }, [tasks]);

  const departmentList = useMemo(() => {
    return departments.map((dept) => {
      return {
        id: dept.id,
        name: dept.name,
        borderColorClass: getBorderColorClass(dept.name),
        stats: getTaskStats(dept.id, isDateInPeriod),
      };
    });
  }, [departments, isDateInPeriod, getTaskStats]);

  const overallStats = useMemo(
    () => getAllTaskStats(isDateInPeriod),
    [getAllTaskStats, isDateInPeriod],
  );

  /**
   * Computes complex analytical metrics (Overdue, High Priority, Upcoming Deadlines)
   * against the current date to determine system health.
   */
  const advancedStats = useMemo(() => {
    let overdueTasks = 0;
    let highPriorityTasks = 0;
    let upcomingDeadlines = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const filteredTasks = tasks.filter((t) =>
      isDateInPeriod(t.targetDate as string | null | undefined),
    );

    filteredTasks.forEach((task: Task) => {
      if (task.priority === "high") highPriorityTasks++;

      if (task.targetDate) {
        const targetDate = new Date(task.targetDate);
        targetDate.setHours(0, 0, 0, 0);

        if (targetDate < today && task.status !== "done") {
          overdueTasks++;
        }

        if (
          targetDate >= today &&
          targetDate <= nextWeek &&
          task.status !== "done"
        ) {
          upcomingDeadlines++;
        }
      }
    });

    const completionRate =
      overallStats.total > 0
        ? Math.round((overallStats.completed / overallStats.total) * 100)
        : 0;

    return {
      completionRate,
      overdueTasks,
      highPriorityTasks,
      upcomingDeadlines,
    };
  }, [tasks, isDateInPeriod, overallStats]);

  const statusChartData = useMemo(
    () =>
      [
        {
          name: "To Do",
          value:
            overallStats.total -
            overallStats.inProgress -
            overallStats.completed,
          color: "#94a3b8",
        },
        {
          name: "In Progress",
          value: overallStats.inProgress,
          color: "#f59e0b",
        },
        { name: "Completed", value: overallStats.completed, color: "#10b981" },
      ].filter((item) => item.value > 0),
    [overallStats],
  );

  const departmentComparisonData = useMemo(
    () =>
      departmentList.map((dept) => ({
        name: dept.name,
        todo: dept.stats.total - dept.stats.inProgress - dept.stats.completed,
        inProgress: dept.stats.inProgress,
        completed: dept.stats.completed,
        total: dept.stats.total,
      })),
    [departmentList],
  );

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    try {
      await api.createDepartment(newDepartmentName.trim());
      toast.success("Department added successfully");

      if (refreshDepartments) await refreshDepartments();
      if (refreshTasks) await refreshTasks();

      setIsAddDepartmentModalOpen(false);
      setNewDepartmentName("");
    } catch (error) {
      toast.error("Failed to add department");
      console.error("Department creation error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Navbar
        onSettingsClick={() => setIsSettingsOpen(true)}
        showLogo={true}
        onProfileClick={onProfileClick}
        onHelpClick={onHelpClick}
      />

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
                Dashboard
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Monitor departmental performance & tasks
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="px-2">
                <CalendarDays className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

              <select
                value={timePeriodType}
                onChange={(e) => {
                  setTimePeriodType(e.target.value as TimePeriodType);
                  setSelectedPeriod("");
                }}
                className="bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer hover:text-indigo-600 transition-colors"
              >
                <option value="all">All Time</option>
                <option value="year">By Year</option>
                <option value="half">By Half Year</option>
                <option value="quarter">By Quarter</option>
                <option value="month">By Month</option>
              </select>

              {timePeriodType !== "all" && (
                <>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {timePeriodType === "half" && (
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="H1">H1</option>
                      <option value="H2">H2</option>
                    </select>
                  )}
                  {timePeriodType === "quarter" && (
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">All</option>
                      <option value="Q1">Q1</option>
                      <option value="Q2">Q2</option>
                      <option value="Q3">Q3</option>
                      <option value="Q4">Q4</option>
                    </select>
                  )}
                  {timePeriodType === "month" && (
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">All</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString("default", {
                            month: "short",
                          })}
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-wrap justify-end gap-3">
          {/* Admin & Manager Action: All Tasks */}
          {(isManager || isAdmin) && (
            <button
              onClick={navigateToAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm font-medium text-sm"
            >
              <Layers className="w-4 h-4" />
              All Tasks
            </button>
          )}

          <ExportButton tasks={tasks} />

          {/* Admin & Manager Action: Add Department */}
          {(isManager || isAdmin) && (
            <button
              onClick={() => setIsAddDepartmentModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Dept
            </button>
          )}

          {/* Admin Exclusive Action: User Management */}
          {isAdmin && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md font-medium text-sm"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
          {departmentList.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Package className="w-12 h-12 mb-4 opacity-20" />
              <p>No departments found.</p>
            </div>
          ) : (
            departmentList.map((dept) => {
              const progressPercent =
                dept.stats.total > 0
                  ? Math.round((dept.stats.completed / dept.stats.total) * 100)
                  : 0;

              return (
                <button
                  key={dept.id}
                  onClick={() => navigateToDept(dept.id)}
                  className={`group relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl p-6 border-t-4 border-l border-r border-b border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left ${dept.borderColorClass}`}
                >
                  <div className="flex justify-between items-start mb-6 w-full">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {dept.name}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {dept.stats.total} total tasks
                      </p>
                    </div>
                    <div className="p-2 rounded-full text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="w-full mt-auto">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-medium text-slate-500">
                        Progress
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-slate-500">
                          {dept.stats.inProgress} Active
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-xs text-slate-500">
                          {dept.stats.completed} Done
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full mb-3 text-slate-500">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {overallStats.total}
            </div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Total Tasks
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full mb-3 text-orange-500">
              <Activity className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {overallStats.inProgress}
            </div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              In Progress
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full mb-3 text-green-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {overallStats.completed}
            </div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Completed
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {advancedStats.completionRate}%
            </div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Success Rate
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Health Metrics
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Overdue Tasks
                    </div>
                    <div className="text-xs text-slate-500">
                      Needs attention
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-red-500">
                  {advancedStats.overdueTasks}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      High Priority
                    </div>
                    <div className="text-xs text-slate-500">Critical items</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-orange-500">
                  {advancedStats.highPriorityTasks}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-500">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Upcoming
                    </div>
                    <div className="text-xs text-slate-500">Next 7 days</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-indigo-500">
                  {advancedStats.upcomingDeadlines}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">
                Status Distribution
              </h4>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 text-center">
                Department Volume
              </h4>
              <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentComparisonData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isAddDepartmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              New Department
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Create a space for a new team to manage their tasks.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="e.g. Marketing, Engineering..."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  onClick={() => {
                    setIsAddDepartmentModalOpen(false);
                    setNewDepartmentName("");
                  }}
                  className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDepartment}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium"
                >
                  Create Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsPage onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
