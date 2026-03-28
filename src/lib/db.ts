import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { HouseholdLog } from "@/types";

interface PahadDB extends DBSchema {
  household_logs: {
    key: string;
    value: HouseholdLog;
    indexes: {
      "by-synced": boolean;
      "by-created": string;
    };
  };
  sync_queue: {
    key: string;
    value: {
      id: string;
      retries: number;
      queued_at: string;
    };
  };
}

let dbInstance: IDBPDatabase<PahadDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PahadDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PahadDB>("pahad-db", 1, {
    upgrade(db) {
      const logsStore = db.createObjectStore("household_logs", { keyPath: "id" });
      logsStore.createIndex("by-synced", "synced");
      logsStore.createIndex("by-created", "created_at");

      db.createObjectStore("sync_queue", { keyPath: "id" });
    },
  });

  return dbInstance;
}

export async function saveLog(log: HouseholdLog): Promise<void> {
  const db = await getDB();
  await db.put("household_logs", log);
  if (!log.synced) {
    await db.put("sync_queue", {
      id: log.id,
      retries: 0,
      queued_at: new Date().toISOString(),
    });
  }
}

export async function getAllLogs(): Promise<HouseholdLog[]> {
  const db = await getDB();
  return db.getAll("household_logs");
}

export async function getPendingLogs(): Promise<HouseholdLog[]> {
  const db = await getDB();
  const index = db.transaction("household_logs").store.index("by-synced");
  return index.getAll(false);
}

export async function markLogSynced(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["household_logs", "sync_queue"], "readwrite");
  const log = await tx.objectStore("household_logs").get(id);
  if (log) {
    log.synced = true;
    delete log.sync_error;
    await tx.objectStore("household_logs").put(log);
  }
  await tx.objectStore("sync_queue").delete(id);
  await tx.done;
}

export async function markLogSyncError(id: string, error: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["household_logs", "sync_queue"], "readwrite");
  const log = await tx.objectStore("household_logs").get(id);
  if (log) {
    log.sync_error = error;
    await tx.objectStore("household_logs").put(log);
  }
  const queueItem = await tx.objectStore("sync_queue").get(id);
  if (queueItem) {
    queueItem.retries += 1;
    await tx.objectStore("sync_queue").put(queueItem);
  }
  await tx.done;
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex("household_logs", "by-synced", false);
}

export async function getLogById(id: string): Promise<HouseholdLog | undefined> {
  const db = await getDB();
  return db.get("household_logs", id);
}
