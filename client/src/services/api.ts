import axios, { AxiosError } from "axios";
import type {
  Task,
  Department,
  NotificationType,
  Comment as TaskComment,
  Notification,
} from "../types";
import type { User } from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * GLOBAL AXIOS INTERCEPTOR
 * Automatically intercept any failed API request globally.
 * If the server responds with 401 Unauthorized (e.g., token expired),
 * the user is forcefully redirected to the login page to re-authenticate.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== "/login") {
        // Clear local storage/cache if necessary, then redirect
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

type LoginResponse = User;

// Type definition for creating a new user (omitting auto-generated DB fields)
type CreateUserInput = Omit<User, "id" | "createdAt"> & {
  password?: string;
  departmentId?: string;
};

export const api = {
  // ==========================================
  // AUTHENTICATION & USER SETTINGS
  // ==========================================
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/users/login", {
      username,
      password,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/users/logout");
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
  },

  // 👇 INI ADALAH FUNGSI BARU YANG DITAMBAHKAN 👇
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const response = await apiClient.put("/users/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // ==========================================
  // MASTER DATA: DEPARTMENTS
  // ==========================================
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>("/departments");
    return response.data;
  },

  createDepartment: async (name: string): Promise<Department> => {
    const response = await apiClient.post<Department>("/departments", { name });
    return response.data;
  },

  // ==========================================
  // CORE LOGIC: TASKS
  // ==========================================
  getTasks: async (departmentId?: string): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>("/tasks", {
      params: departmentId ? { departmentId } : {},
    });

    // Ensure tags are consistently parsed into an array of strings
    return response.data.map((task) => ({
      ...task,
      tags:
        typeof task.tags === "string"
          ? (task.tags as string).split(",")
          : task.tags || [],
    }));
  },

  createTask: async (task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post<Task>("/tasks", task);
    return response.data;
  },

  createTasksBatch: async (tasks: Partial<Task>[]): Promise<void> => {
    await apiClient.post("/tasks/batch", tasks);
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  // ==========================================
  // INTERACTIONS: COMMENTS
  // ==========================================
  addComment: async (
    taskId: string,
    text: string,
    user: string,
  ): Promise<TaskComment> => {
    const response = await apiClient.post<TaskComment>(
      `/tasks/${taskId}/comments`,
      { text, user },
    );
    return response.data;
  },

  // ==========================================
  // SYSTEM: NOTIFICATIONS
  // ==========================================
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>("/notifications");
    return response.data;
  },

  createNotification: async (
    title: string,
    message: string,
    type: NotificationType,
  ): Promise<Notification> => {
    const response = await apiClient.post<Notification>("/notifications", {
      title,
      message,
      type,
    });
    return response.data;
  },

  // ==========================================
  // ADMINISTRATION: USER MANAGEMENT
  // ==========================================
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
  },

  createUser: async (user: CreateUserInput): Promise<User> => {
    const response = await apiClient.post<User>("/users", user);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.put(`/users/${id}/reset-password`, { newPassword });
  },

  getSystemSettings: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get("/settings");
    return response.data;
  },

  updateSystemSetting: async (
    key: string,
    value: string,
  ): Promise<{ key: string; value: string }> => {
    const response = await apiClient.post("/settings", { key, value });
    return response.data;
  },
};

export default api;
