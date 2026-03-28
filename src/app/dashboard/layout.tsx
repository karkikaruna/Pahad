"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { startAutoSync } from "@/lib/sync";
import SyncBadge from "@/components/ui/SyncBadge";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session) {
      const cleanup = startAutoSync(30000);
      return cleanup;
    }
  }, [session]);

  if (loading || !session) {
    return (
      <div className={styles.loading}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M24 6 L40 38 H8 Z" fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round"/>
              <path d="M17 38 L24 22 L31 38" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round"/>
            </svg>
            <span className={styles.logoText}>पहाड</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <SyncBadge />
          <button
            className={styles.signOutBtn}
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
            title="बाहिर निस्कनुहोस्"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <nav className={styles.bottomNav}>
        <a href="/dashboard" className={styles.navItem}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>गृहपृष्ठ</span>
        </a>
        <a href="/form" className={styles.navItemAccent}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span>नयाँ सर्वेक्षण</span>
        </a>
        <a href="/dashboard/map" className={styles.navItem}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
            <line x1="9" y1="3" x2="9" y2="18"/>
            <line x1="15" y1="6" x2="15" y2="21"/>
          </svg>
          <span>नक्शा</span>
        </a>
      </nav>
    </div>
  );
}
