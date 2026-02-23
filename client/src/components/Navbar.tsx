import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
  Moon,
  Sun,
  Check,
  Trash2,
  Menu,
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import logo from "../assets/logo.png";

type NavbarProps = {
  onHomeClick?: () => void;
  showBackButton?: boolean;
  onSettingsClick: () => void;
  showLogo?: boolean;
  onProfileClick?: () => void;
  onHelpClick?: () => void;
  onMenuClick?: () => void;
};

/**
 * Global Navigation Bar Component.
 * Handles top-level routing, user session management, theme toggling,
 * and real-time system notifications.
 */
export function Navbar({
  onSettingsClick,
  showLogo = false,
  onMenuClick,
  onHelpClick,
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme } = useTheme();
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  // Dynamically construct user display profile from the authenticated context
  const profileName = authUser?.username
    ? authUser.username.charAt(0).toUpperCase() + authUser.username.slice(1)
    : "User";

  const profileRole = authUser?.role
    ? authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1)
    : "Staff";

  const user = {
    name: profileName,
    email: `${profileName.toLowerCase().replace(/\s+/g, ".")}@company.com`,
    role: profileRole,
    // Consistent avatar generation utilizing DiceBear API
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${profileName}&backgroundColor=0ea5e9`,
  };

  // Close dropdown menus automatically when clicking outside of their respective containers
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT SECTION: Mobile Menu Toggle & App Logo */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg md:hidden focus:outline-none"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {showLogo && (
              <div
                className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                onClick={() => navigate("/")}
              >
                <img src={logo} alt="NPBM Logo" className="h-8 w-auto" />
              </div>
            )}
          </div>

          {/* RIGHT SECTION: Quick Actions & Profile */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={() => (onHelpClick ? onHelpClick() : navigate("/help"))}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              title="Help Center"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications Dropdown Container */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={markAllAsRead}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                        title="Mark all as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                        title="Clear all notifications"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0 transition-colors ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                        >
                          <p
                            className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} text-gray-900 dark:text-white truncate`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden sm:block"
              title="Global Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Profile Dropdown Container */}
            <div className="relative ml-1 sm:ml-2" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover shadow-sm"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
                    {user.role}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""} hidden sm:block`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Mobile-only visible header inside dropdown */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 block md:hidden bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-0.5">
                      {user.role}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSettingsClick?.();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 md:hidden transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Account
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
