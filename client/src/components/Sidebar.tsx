import { useState, useRef, useEffect } from "react";
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  LogOut,
  CheckSquare,
  Layers,
  HelpCircle,
  X,
} from "lucide-react";
import type { Department } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useTasks } from "../context/TasksContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

type SidebarProps = {
  selectedDepartment: Department | null;
  onDepartmentSelect: (department: Department) => void;
  onAllTasksSelect?: () => void;
  onSettingsClick: () => void;
  onProfileClick?: () => void;
  onCloseMobile?: () => void;
};

/**
 * Responsive Sidebar Navigation.
 * Provides access to department filtering, theme toggling, and settings.
 * Includes mobile-specific layouts and event handlers.
 */
export function Sidebar({
  selectedDepartment,
  onDepartmentSelect,
  onAllTasksSelect,
  onSettingsClick,
  onCloseMobile,
}: SidebarProps) {
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();
  const { currentUser, user: authUser, logout } = useAuth();
  const { departments } = useTasks();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  // Dynamically generate user profile matching Navbar behavior
  const profileName = currentUser
    ? currentUser.charAt(0).toUpperCase() + currentUser.slice(1)
    : "User";

  const profileRole = authUser?.role
    ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)
    : "Staff";

  const user = {
    name: profileName,
    role: profileRole,
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${profileName}&backgroundColor=0ea5e9`,
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Helper function to execute navigation actions and simultaneously
   * close the mobile sidebar overlay if it is open.
   */
  const handleNav = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
        <div
          className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
          onClick={() => handleNav(() => navigate("/"))}
        >
          <img src={logo} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Global Actions */}
      <div className="px-4 py-4 space-y-1 shrink-0">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-orange-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
            <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
          </div>
        </button>

        {/* Mobile Notifications Trigger */}
        <div className="relative md:hidden" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => handleNav(onSettingsClick)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-400" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => handleNav(() => navigate("/help"))}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span>Help Center</span>
        </button>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 pl-3">
          Overview
        </div>
        <div className="space-y-1">
          {onAllTasksSelect && (
            <button
              onClick={() => handleNav(onAllTasksSelect)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                !selectedDepartment
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>All Tasks</span>
            </button>
          )}

          <div>
            <button
              onClick={() => setIsTasksExpanded(!isTasksExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                <span>Departments</span>
              </div>
              {isTasksExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {isTasksExpanded && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-800 pl-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleNav(() => onDepartmentSelect(dept))}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-lg truncate transition-colors ${
                      selectedDepartment?.id === dept.id
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Footer Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-1 md:hidden shrink-0 bg-gray-50 dark:bg-gray-800/50">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
          >
            <img
              src={user.avatar}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
              alt="Profile"
            />
            <div className="flex-1 text-left overflow-hidden min-w-0">
              <div className="text-sm font-bold truncate text-gray-900 dark:text-white">
                {user.name}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 truncate mt-0.5">
                {user.role}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>

          {isProfileOpen && (
            <div className="absolute left-full ml-2 bottom-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-2 transform -translate-x-full -translate-y-full top-0 animate-in fade-in duration-200">
              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
