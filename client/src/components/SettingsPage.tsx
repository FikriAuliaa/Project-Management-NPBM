import { useState, useEffect } from "react";
import {
  X,
  Moon,
  Sun,
  Monitor,
  Users,
  Shield,
  User,
  Bell,
  Palette,
  Database,
  Lock,
  Layout,
  LayoutList,
  Calendar,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { UserManagementTab } from "./UserManagementTab";
import { useSystemSettings } from "../hooks/useSystemSettings";
import { api } from "../services/api";
import toast from "react-hot-toast";

type SettingsPageProps = {
  onClose: () => void;
};

type TabType =
  | "appearance"
  | "account"
  | "notifications"
  | "data"
  | "users"
  | "system-rules";
type ViewType = "kanban" | "list" | "calendar";

// --- EXTERNAL COMPONENT ---
type TabButtonProps = {
  id: TabType;
  icon: React.ElementType;
  label: string;
  activeTab: TabType;
  onClick: (id: TabType) => void;
};

function TabButton({
  id,
  icon: Icon,
  label,
  activeTab,
  onClick,
}: TabButtonProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        activeTab === id
          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// --- SYSTEM RULES TAB COMPONENT (ADMIN ONLY) ---
function SystemRulesTab() {
  const { departments } = useTasks();
  const { settings, refetchSettings } = useSystemSettings();
  const [isSaving, setIsSaving] = useState(false);

  const [boardId, setBoardId] = useState("");
  const [managerId, setManagerId] = useState("");

  useEffect(() => {
    if (settings) {
      setBoardId(settings["GLOBAL_BOARD_DEPT_ID"] || "");
      setManagerId(settings["GLOBAL_MANAGER_DEPT_ID"] || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateSystemSetting("GLOBAL_BOARD_DEPT_ID", boardId);
      await api.updateSystemSetting("GLOBAL_MANAGER_DEPT_ID", managerId);
      toast.success("System Rules berhasil diperbarui");
      refetchSettings();
    } catch (err) {
      // PERBAIKAN 1: Gunakan variabel err (console.error) agar ESLint tidak protes "unused var"
      console.error("Gagal menyimpan rules:", err);
      toast.error("Gagal menyimpan System Rules");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            1. Global Task Board (Target Department)
          </h4>
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">-- Pilih Departemen --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            Departemen mana yang bertindak sebagai "Papan Utama" (Contoh: "All
            Dept").
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            2. Delegated Manager (Owner Department)
          </h4>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="">-- Pilih Departemen --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            Departemen mana yang memiliki hak penuh (edit/drag) pada task di
            Global Board tersebut (Contoh: "NPC").
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Save System Rules"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Global Settings Modal Component.
 */
export function SettingsPage({ onClose }: SettingsPageProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, currentUser, isManager, department } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("appearance");

  const [defaultView, setDefaultView] = useState<ViewType>(() => {
    const savedView = localStorage.getItem("pref_defaultView");
    return savedView === "kanban" ||
      savedView === "list" ||
      savedView === "calendar"
      ? savedView
      : "kanban";
  });

  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem("pref_compactMode") === "true";
  });

  const [notifyDeadlines, setNotifyDeadlines] = useState<boolean>(() => {
    const saved = localStorage.getItem("pref_notifyDeadlines");
    return saved !== null ? saved === "true" : true;
  });

  const [notifySystem, setNotifySystem] = useState<boolean>(() => {
    const saved = localStorage.getItem("pref_notifySystem");
    return saved !== null ? saved === "true" : true;
  });

  // --- PASSWORD CHANGE STATES ---
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleViewChange = (view: ViewType) => {
    setDefaultView(view);
    localStorage.setItem("pref_defaultView", view);
    toast.success("Default view updated");
  };

  const toggleCompactMode = () => {
    const newVal = !compactMode;
    setCompactMode(newVal);
    localStorage.setItem("pref_compactMode", String(newVal));
    toast.success(newVal ? "Compact mode enabled" : "Compact mode disabled");
  };

  const handleClearCache = () => {
    localStorage.removeItem("pref_defaultView");
    localStorage.removeItem("pref_compactMode");
    localStorage.removeItem("pref_notifyDeadlines");
    localStorage.removeItem("pref_notifySystem");
    toast.success("Local cache cleared successfully");
    setTimeout(() => window.location.reload(), 1000);
  };

  // --- PASSWORD CHANGE HANDLER ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);

      toast.success("Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err: unknown) {
      // PERBAIKAN 2: Menggunakan err: unknown dan console.error untuk mematuhi ESLint
      console.error("Change password error:", err);

      // PERBAIKAN 3: Casting tipe aman (tanpa 'any') agar bisa membaca struktur error axios
      const axiosError = err as { response?: { data?: { error?: string } } };
      toast.error(
        axiosError.response?.data?.error || "Gagal mengubah password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getDepartmentName = () => {
    if (!department) return "Global / All Access";
    if (typeof department === "string") return department;
    return department.name || "Global / All Access";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-700">
        {/* --- LEFT SIDEBAR --- */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-600" /> Settings
            </h2>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            <TabButton
              id="appearance"
              icon={Palette}
              label="Appearance"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="account"
              icon={User}
              label="My Account"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="notifications"
              icon={Bell}
              label="Notifications"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="data"
              icon={Database}
              label="Data & Storage"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            {isAdmin && (
              <>
                <div className="my-4 border-t border-slate-200 dark:border-slate-700"></div>
                <div className="px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Administration
                </div>
                <TabButton
                  id="users"
                  icon={Users}
                  label="User Management"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                />
                <TabButton
                  id="system-rules"
                  icon={ShieldCheck}
                  label="System Rules"
                  activeTab={activeTab}
                  onClick={setActiveTab}
                />
              </>
            )}
          </nav>

          {/* User Info Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {currentUser?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentUser}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  {isAdmin ? (
                    <span className="text-red-500 flex items-center gap-1 font-medium">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : isManager ? (
                    "Manager"
                  ) : (
                    "Staff"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT AREA --- */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
          <div className="h-16 px-8 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 shrink-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {activeTab.replace("-", " ")} Preferences
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {/* 1. APPEARANCE TAB */}
            {activeTab === "appearance" && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Interface Theme
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                        {theme === "dark" ? (
                          <Moon className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <Sun className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          Dark Mode
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          Adjust the interface theme for better visibility.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${theme === "dark" ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Layout Preferences
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-6">
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
                        Default Task View
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "kanban", icon: Layout, label: "Kanban" },
                          { id: "list", icon: LayoutList, label: "List" },
                          { id: "calendar", icon: Calendar, label: "Calendar" },
                        ].map((view) => (
                          <button
                            key={view.id}
                            onClick={() =>
                              handleViewChange(view.id as ViewType)
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${defaultView === view.id ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300"}`}
                          >
                            <view.icon className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">
                              {view.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-5 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          Compact Mode
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          Reduce padding in lists to show more data.
                        </p>
                      </div>
                      <button
                        onClick={toggleCompactMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${compactMode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compactMode ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* 2. ACCOUNT TAB */}
            {activeTab === "account" && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Profile Details
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 items-center">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Username
                      </div>
                      <div className="col-span-2 text-sm font-bold text-slate-900 dark:text-white">
                        {currentUser}
                      </div>
                    </div>
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 items-center">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        System Role
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {isAdmin
                            ? "Administrator"
                            : isManager
                              ? "Manager"
                              : "Staff"}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 grid grid-cols-3 gap-4 items-center">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Division
                      </div>
                      <div className="col-span-2 text-sm font-bold text-slate-900 dark:text-white">
                        {getDepartmentName()}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Security
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                          <Lock className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                            Password Management
                          </h5>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Update your account password securely.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowPasswordForm(!showPasswordForm);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className={`px-4 py-2 border rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                          showPasswordForm
                            ? "bg-slate-200 border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {showPasswordForm ? "Cancel" : "Change Password"}
                      </button>
                    </div>

                    {/* FOLD-OUT PASSWORD FORM */}
                    {showPasswordForm && (
                      <form
                        onSubmit={handleChangePassword}
                        className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              required
                              className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            New Password
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            {isChangingPassword
                              ? "Saving..."
                              : "Save New Password"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Alert Preferences
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                    <div className="p-5 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          Deadline Reminders
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          Get notified when tasks are approaching deadlines.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNotifyDeadlines(!notifyDeadlines);
                          localStorage.setItem(
                            "pref_notifyDeadlines",
                            String(!notifyDeadlines),
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notifyDeadlines ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifyDeadlines ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                          System Announcements
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          Receive updates about platform maintenance.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNotifySystem(!notifySystem);
                          localStorage.setItem(
                            "pref_notifySystem",
                            String(!notifySystem),
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${notifySystem ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifySystem ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* 4. DATA & STORAGE TAB */}
            {activeTab === "data" && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <section>
                  <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Local Storage Management
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-white text-base">
                          Clear Local Cache
                        </h5>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          This will reset all your UI preferences to defaults.
                          This will <strong>not</strong> log you out.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearCache}
                      className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40 font-semibold rounded-xl transition-colors w-full sm:w-auto"
                    >
                      Clear Cache & Reload
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* 5. USER MANAGEMENT TAB */}
            {activeTab === "users" && isAdmin && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full">
                <UserManagementTab />
              </div>
            )}

            {/* 6. SYSTEM RULES TAB */}
            {activeTab === "system-rules" && isAdmin && <SystemRulesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
