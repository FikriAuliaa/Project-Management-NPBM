import {
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";

import { HomePage } from "./components/HomePage";
import { DepartmentTaskPage } from "./components/DepartmentTaskPage";
import { LoginPage } from "./components/LoginPage";
import { ProfilePage } from "./components/ProfilePage";
import { SettingsPage } from "./components/SettingsPage";
import { HelpPage } from "./components/HelpPage";

import { TasksProvider } from "./context/TasksContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "react-hot-toast";

/**
 * Route Wrapper for Department pages.
 * Captures the dynamic parameter (idOrName) from the URL and passes it to the page.
 */
function DepartmentRoute() {
  const { idOrName } = useParams<{ idOrName: string }>();
  const navigate = useNavigate();

  if (!idOrName) {
    return <Navigate to="/" replace />;
  }

  return (
    <DepartmentTaskPage
      idOrName={idOrName}
      onBack={() => navigate("/")}
      isCombinedView={false}
    />
  );
}

/**
 * Main application layout and routing.
 * Protected by authentication layer.
 */
function AppContent() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Protected Route Logic
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/department/:idOrName" element={<DepartmentRoute />} />

        <Route
          path="/profile"
          element={
            <ProfilePage
              onBack={() => navigate(-1)}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          }
        />
        <Route path="/help" element={<HelpPage />} />

        <Route
          path="/all-tasks"
          element={
            <DepartmentTaskPage
              isCombinedView={true}
              onBack={() => navigate(-1)}
            />
          }
        />

        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isSettingsOpen && (
        <SettingsPage onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
}

/**
 * Root Application Component.
 * Provider Hierarchy matters: AuthProvider must wrap Notifications and Tasks
 * so they can consume the authenticated user state.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <TasksProvider>
            <AppContent />
            <Toaster position="top-right" />
          </TasksProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
