import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  PlusCircle,
  Activity,
  Settings,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { useAuth } from "../context/AuthContext";

type ProfilePageProps = {
  onBack: () => void;
  onSettingsClick: () => void;
};

interface ActivityLog {
  id: string;
  action: string;
  targetName: string;
  extraText: string | null;
  createdAt: string;
}

export function ProfilePage({ onBack, onSettingsClick }: ProfilePageProps) {
  // [PERBAIKAN] Ambil object 'user' asli dari context
  const { currentUser, user } = useAuth();

  // --- 1. SETTING NAMA ---
  const profileName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "User";

  // --- 2. SETTING ROLE ---
  const profileRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";

  // --- 3. SETTING DEPARTMENT ---
  // Mengekstrak nama departemen sesuai dengan tipe (bisa object atau string di AuthContext)
  let profileDept = "General";
  if (user?.department) {
    if (typeof user.department === "object" && "name" in user.department) {
      profileDept = user.department.name;
    } else if (typeof user.department === "string") {
      profileDept = user.department;
    }
  }

  // --- FETCH DATA ACTIVITY LOG ---
  const { data: realActivities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["userActivities", currentUser],
    queryFn: async () => {
      const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const baseUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

      const response = await fetch(`${baseUrl}/api/users/activities`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil data aktivitas");
      }

      return response.json();
    },
  });

  const getActivityStyles = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("created") || act.includes("added a task")) {
      return {
        icon: PlusCircle,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30 border-purple-200",
      };
    }
    if (act.includes("comment")) {
      return {
        icon: MessageSquare,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30 border-blue-200",
      };
    }
    if (act.includes("done") || act.includes("completed")) {
      return {
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30 border-green-200",
      };
    }
    if (act.includes("attached") || act.includes("file")) {
      return {
        icon: Paperclip,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30 border-orange-200",
      };
    }
    return {
      icon: Activity,
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-800 border-gray-200",
    };
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar onSettingsClick={onSettingsClick} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Tombol Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-medium w-fit"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        {/* --- HEADER PROFIL --- */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center mb-8">
          {/* Foto Profil */}
          <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full border-4 border-gray-50 dark:border-gray-700 bg-white dark:bg-gray-700 overflow-hidden shadow-md">
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${profileName}&backgroundColor=0ea5e9`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Nama & Info (ASLI DARI DATABASE) */}
          <div className="mt-5 space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {profileName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {profileRole}
            </p>
            <div className="inline-flex items-center justify-center mt-3 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full tracking-wide uppercase">
              {profileDept} Dept
            </div>
          </div>

          {/* Tombol Edit Profile */}
          <button
            onClick={onSettingsClick}
            className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full font-semibold transition-all shadow-sm active:scale-95"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* --- TIMELINE AKTIVITAS --- */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-700/50 pb-4">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-500" />
              Activity History
            </h3>
            {!isLoading && realActivities && (
              <span className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full font-bold">
                {realActivities.length} logs
              </span>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Loading your journey...
                </span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!realActivities || realActivities.length === 0) && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                No activity yet
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                Your recent actions like creating tasks or adding comments will
                appear here. Start managing your projects!
              </p>
            </div>
          )}

          {/* Activity List */}
          {!isLoading && realActivities && realActivities.length > 0 && (
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 md:ml-6 space-y-8">
              {realActivities.map((activity) => {
                const styles = getActivityStyles(activity.action);
                const Icon = styles.icon;

                return (
                  <div
                    key={activity.id}
                    className="relative pl-8 md:pl-10 group"
                  >
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-[3px] border-white dark:border-gray-800 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${styles.bg}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${styles.color}`} />
                    </div>

                    {/* Timeline Content */}
                    <div className="bg-gray-50/50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm transition-all hover:shadow-md hover:bg-white dark:hover:bg-gray-800">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <p className="text-base text-gray-700 dark:text-gray-300 leading-snug">
                          {activity.action}{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {activity.targetName}
                          </span>
                        </p>
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 shrink-0 bg-white dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-800">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>

                      {/* Extra Text (Comment, etc) */}
                      {activity.extraText && (
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200/60 dark:border-gray-700/50 relative">
                          <div className="absolute top-2 left-2 text-gray-200 dark:text-gray-700 text-2xl font-serif leading-none">
                            "
                          </div>
                          <span className="relative z-10 pl-4 block">
                            {activity.extraText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
