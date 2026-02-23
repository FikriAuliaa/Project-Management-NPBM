import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { Notification, NotificationType } from "../types";
import { useAuth } from "./AuthContext";

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    title: string,
    message: string,
    type: NotificationType,
  ) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  loading: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Network error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Polling mechanism to keep notifications up-to-date
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isAuthenticated) {
      fetchNotifications();
      intervalId = setInterval(() => {
        fetchNotifications();
      }, 30000); // 30s polling
    } else {
      setNotifications([]);
      setLoading(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, fetchNotifications]);

  const addNotification = async (
    title: string,
    message: string,
    type: NotificationType,
  ) => {
    try {
      const newNotif = await api.createNotification(title, message, type);

      if (newNotif && newNotif.id) {
        setNotifications((prev) => [newNotif, ...prev]);
      } else {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to push notification:", error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => n && !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
};
