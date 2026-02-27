import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useTasks } from "../context/TasksContext";
import { Trash2, RefreshCw, Plus, User, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Type definition for user management data payload.
 */
interface UserData {
  id: string;
  username: string;
  role: string;
  department?: {
    id: string;
    name: string;
  };
}

/**
 * Administrative panel for managing system users.
 * Allows Admins to create new users, reset passwords, and delete accounts.
 */
export function UserManagementTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { departments } = useTasks();

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Staff");
  const [newDeptId, setNewDeptId] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await api.getAllUsers();
      setUsers(data as UserData[]);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load user list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    try {
      await api.createUser({
        username: newUsername,
        password: newPassword,
        role: newRole,
        // Send an empty string if no department is selected, as expected by the API
        departmentId: newDeptId,
      });

      toast.success(`User ${newUsername} created successfully`);
      setIsCreating(false);
      setNewUsername("");
      setNewPassword("");
      setNewDeptId("");
      fetchUsers();
    } catch (error) {
      console.error("Create User Error:", error);
      toast.error("Failed to create user");
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user: ${username}?`))
      return;
    try {
      await api.deleteUser(id);
      toast.success("User deleted successfully");
      setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      console.error("Delete User Error:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    const newPass = window.prompt(`Enter new password for ${username}:`);
    if (!newPass) return;
    try {
      await api.resetPassword(id, newPass);
      toast.success("Password reset successfully");
    } catch (error) {
      console.error("Reset Password Error:", error);
      toast.error("Failed to reset password");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Administrative
            Access
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage user roles and credentials.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm shadow-sm ${
            isCreating
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20"
          }`}
        >
          {isCreating ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add User
            </>
          )}
        </button>
      </div>

      {/* Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateUser}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                required
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="e.g. jdoe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Initial Password
              </label>
              <input
                required
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                placeholder="Temporary password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                System Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              >
                <option value="Staff">Operator (Read/Write Own Dept)</option>
                <option value="Manager">Manager (Global Edit)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>

            {newRole !== "Admin" && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assigned Department
                </label>
                <select
                  value={newDeptId}
                  onChange={(e) => setNewDeptId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 shadow-md transition-all active:scale-95"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* Users Data Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading user registry...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    Username
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    System Role
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">
                    Department
                  </th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      {user.username}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${
                          user.role === "Admin"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : user.role === "Manager"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {user.department?.name || (
                        <span className="text-slate-400 italic">Global</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleResetPassword(user.id, user.username)
                          }
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
