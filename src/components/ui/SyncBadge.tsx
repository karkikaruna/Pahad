"use client";

import { useSyncStatus } from "@/hooks/useSyncStatus";
import styles from "./SyncBadge.module.css";

export default function SyncBadge() {
  const { pendingCount, isSyncing, isOnline, triggerSync } = useSyncStatus();

  return (
    <button
      className={`${styles.badge} ${!isOnline ? styles.offline : ""}`}
      onClick={triggerSync}
      title={isOnline ? "सिङ्क गर्नुहोस्" : "अफलाइन"}
      disabled={isSyncing || !isOnline}
    >
      {isSyncing ? (
        <>
          <div className={styles.spinner} />
          <span>सिङ्क...</span>
        </>
      ) : !isOnline ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1"/>
          </svg>
          <span>अफलाइन</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          <span>
            {pendingCount > 0 ? `${pendingCount} बाँकी` : "सिङ्क भयो"}
          </span>
          {pendingCount > 0 && (
            <span className={styles.count}>{pendingCount}</span>
          )}
        </>
      )}
    </button>
  );
}
