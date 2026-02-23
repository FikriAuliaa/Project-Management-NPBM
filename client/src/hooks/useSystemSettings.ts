import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useSystemSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.getSystemSettings();
      setSettings(data || {});
    } catch (error) {
      console.error("Gagal memuat system settings", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, refetchSettings: fetchSettings };
}
