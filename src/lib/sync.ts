import { supabase } from "./supabase";
import { getPendingLogs, markLogSynced, markLogSyncError } from "./db";
import type { HouseholdLog } from "@/types";

let isSyncing = false;

export async function syncPendingLogs(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingLogs = await getPendingLogs();

    for (const log of pendingLogs) {
      try {
        await uploadLog(log);
        await markLogSynced(log.id);
        synced++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        await markLogSyncError(log.id, errorMsg);
        failed++;
      }
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

async function uploadLog(log: HouseholdLog): Promise<void> {
  const { synced, sync_error, ...uploadData } = log;

  const { error } = await supabase.from("household_logs").upsert(uploadData, {
    onConflict: "id",
  });

  if (error) throw error;
}

export function startAutoSync(intervalMs = 30000): () => void {
  const sync = async () => {
    if (navigator.onLine) {
      await syncPendingLogs();
    }
  };

  // Sync on online event
  window.addEventListener("online", sync);

  // Periodic sync
  const interval = setInterval(sync, intervalMs);

  // Initial sync
  sync();

  return () => {
    window.removeEventListener("online", sync);
    clearInterval(interval);
  };
}

export function getIsSyncing(): boolean {
  return isSyncing;
}

export async function triggerHighRiskNotification(
  householdName: string,
  score: number
): Promise<void> {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission === "granted") {
    new Notification("⚠️ उच्च जोखिम पहिचान भयो", {
      body: `${householdName} - जोखिम स्कोर: ${score}/100\nतुरुन्तै स्वास्थ्य अधिकारीलाई सूचित गर्नुहोस्।`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: `high-risk-${Date.now()}`,
      requireInteraction: true,
    });
  }
}
