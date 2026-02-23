/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task, Department, Status } from "../types";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

type Stats = {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
};

type TasksContextType = {
  tasks: Task[];
  departments: Department[];
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  refreshDepartments: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (updatedTask: Task) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: Status) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTaskStats: (deptId: string, filterFn?: (date: string) => boolean) => Stats;
  getAllTaskStats: (filterFn?: (date: string) => boolean) => Stats;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

/**
 * Pure helper function to consistently extract the department ID
 * regardless of how the API payload is structured.
 */
const resolveDepartmentId = (task: Task): string => {
  if (task.departmentId) return task.departmentId;
  if (task.department) {
    if (typeof task.department === "object" && "id" in task.department) {
      return (task.department as { id: string }).id;
    }
    if (typeof task.department === "string") {
      return task.department;
    }
  }
  return "";
};

export function TasksProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // =====================================
  // 1. DATA FETCHING (Queries)
  // =====================================

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    refetch: refetchTasksQuery,
  } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      // Short-circuit API call if token is evidently missing
      if (!document.cookie.includes("token") && !localStorage.getItem("token"))
        return [];
      return await api.getTasks();
    },
    enabled: isAuthenticated,
  });

  const { data: departments = [], refetch: refetchDepartmentsQuery } = useQuery<
    Department[]
  >({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!document.cookie.includes("token") && !localStorage.getItem("token"))
        return [];
      return await api.getDepartments();
    },
    enabled: isAuthenticated,
  });

  // =====================================
  // 2. DATA MUTATION
  // =====================================

  const createTaskMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (err) => {
      console.error("Task Creation Error:", err);
      toast.error("Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: (err) => {
      console.error("Task Update Error:", err);
      toast.error("Failed to update task");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (err) => {
      console.error("Task Deletion Error:", err);
      toast.error("Failed to delete task");
    },
  });

  // =====================================
  // 3. ACTION WRAPPERS
  // =====================================

  const createTask = useCallback(
    async (taskData: Partial<Task>) => {
      await createTaskMutation.mutateAsync(taskData);
    },
    [createTaskMutation],
  );

  const updateTask = useCallback(
    async (updatedTask: Task) => {
      await updateTaskMutation.mutateAsync({
        id: updatedTask.id,
        data: updatedTask,
      });
    },
    [updateTaskMutation],
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: Status) => {
      const task = tasks.find((t) => t.id === taskId);
      let newProgress = task?.progress || 0;

      // Auto-sync progress when status strictly changes to done/todo
      if (newStatus === "done") newProgress = 100;
      else if (newStatus === "todo") newProgress = 0;

      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus, progress: newProgress },
      });
    },
    [tasks, updateTaskMutation],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      await deleteTaskMutation.mutateAsync(taskId);
    },
    [deleteTaskMutation],
  );

  const refreshTasks = useCallback(async () => {
    await refetchTasksQuery();
  }, [refetchTasksQuery]);

  const refreshDepartments = useCallback(async () => {
    await refetchDepartmentsQuery();
  }, [refetchDepartmentsQuery]);

  // =====================================
  // 4. ANALYTICS & STATISTICS
  // =====================================

  const getTaskStats = useCallback(
    (deptId: string, filterFn?: (date: string) => boolean): Stats => {
      const deptTasks = tasks.filter((t) => resolveDepartmentId(t) === deptId);
      const filteredTasks = filterFn
        ? deptTasks.filter((t) => filterFn(t.targetDate || ""))
        : deptTasks;

      return {
        total: filteredTasks.length,
        todo: filteredTasks.filter((t) => t.status === "todo").length,
        inProgress: filteredTasks.filter((t) => t.status === "in_progress")
          .length,
        completed: filteredTasks.filter((t) => t.status === "done").length,
      };
    },
    [tasks],
  );

  const getAllTaskStats = useCallback(
    (filterFn?: (date: string) => boolean): Stats => {
      const filteredTasks = filterFn
        ? tasks.filter((t) => filterFn(t.targetDate || ""))
        : tasks;
      return {
        total: filteredTasks.length,
        todo: filteredTasks.filter((t) => t.status === "todo").length,
        inProgress: filteredTasks.filter((t) => t.status === "in_progress")
          .length,
        completed: filteredTasks.filter((t) => t.status === "done").length,
      };
    },
    [tasks],
  );

  // =====================================
  // 5. CONTEXT EXPORT
  // =====================================

  const contextValue = useMemo(
    () => ({
      tasks,
      departments,
      isLoading: isTasksLoading,
      refreshTasks,
      refreshDepartments,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      getTaskStats,
      getAllTaskStats,
    }),
    [
      tasks,
      departments,
      isTasksLoading,
      refreshTasks,
      refreshDepartments,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      getTaskStats,
      getAllTaskStats,
    ],
  );

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used within a TasksProvider");
  return context;
}
