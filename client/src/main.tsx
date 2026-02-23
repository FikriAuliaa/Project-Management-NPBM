import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 2. Buat Instance Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Coba fetch ulang 1x jika gagal
      refetchOnWindowFocus: false, // Jangan auto-refresh saat ganti tab (opsional)
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. Bungkus Aplikasi dengan QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Provider lainnya masuk di sini */}
        <ThemeProvider>
          <AuthProvider>
            <App />
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
