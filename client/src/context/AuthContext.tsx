/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";

export interface User {
  id: string;
  username: string;
  role: string;
  department?:
    | {
        id: string;
        name: string;
      }
    | string;
  [key: string]: unknown;
}

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  currentUser: string | undefined;
  isManager: boolean;
  isAdmin: boolean;
  department: User["department"];
  login: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  canEdit: (deptIdentifier: string) => boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user session on initial load via HttpOnly Cookie validation
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        // Silently catch error; unauthenticated users will be redirected by App routing
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (u: string, p: string): Promise<boolean> => {
    try {
      const data = await api.login(u, p);
      setUser(data);
      toast.success(`Welcome ${data.username}`);
      return true;
    } catch (e) {
      console.error("Login Authentication Error:", e);
      toast.error("Login failed. Check your username and password.");
      throw e;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.error("Logout Network Error:", e);
    } finally {
      // Purge state and force full page reload to clear memory
      setUser(null);
      window.location.href = "/login";
    }
  };

  /**
   * Determine if the current user has modification rights for a specific department
   */
  const canEdit = (deptIdentifier: string): boolean => {
    if (!user) return false;

    const role = user.role.toLowerCase();
    if (role === "manager" || role === "admin") return true;

    let userDeptId = "";
    if (user.department) {
      if (typeof user.department === "object" && "id" in user.department) {
        userDeptId = user.department.id;
      } else {
        userDeptId = String(user.department);
      }
    }

    return userDeptId === deptIdentifier;
  };

  const isManager = user?.role?.toLowerCase() === "manager";
  const isAdmin = user?.role?.toLowerCase() === "admin";

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        currentUser: user?.username,
        isManager,
        isAdmin,
        department: user?.department,
        login,
        logout,
        canEdit,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
