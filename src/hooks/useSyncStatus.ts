"use client";

import { useEffect, useState, useCallback } from "react";
import { getPendingCount } from "@/lib/db";
import { syncPendingLogs, getIsSyncing } from "@/lib/sync";

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refreshPending = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingLogs();
      setLastSync(new Date());
      await refreshPending();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, refreshPending]);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    refreshPending();
    const interval = setInterval(refreshPending, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, refreshPending]);

  return { pendingCount, isSyncing, isOnline, lastSync, triggerSync, refreshPending };
}
