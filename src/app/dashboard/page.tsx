"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllLogs } from "@/lib/db";
import { getRiskColor, getRiskLevel } from "@/lib/risk";
import type { HouseholdLog } from "@/types";
import styles from "./page.module.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<HouseholdLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllLogs()
      .then((data) => {
        const sorted = data.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLogs(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = logs.length;
  const highRisk = logs.filter((l) => l.risk_score >= 70).length;
  const mediumRisk = logs.filter((l) => l.risk_score >= 25 && l.risk_score < 70).length;
  const pending = logs.filter((l) => !l.synced).length;

  return (
    <div className={styles.page}>
      <div className={styles.greeting}>
        <h2 className={styles.greetTitle}>नमस्ते 🙏</h2>
        <p className={styles.greetSub}>{user?.email}</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="कुल सर्वेक्षण" value={total} icon="📋" color="accent" />
        <StatCard label="उच्च जोखिम" value={highRisk} icon="🔴" color="danger" />
        <StatCard label="मध्यम जोखिम" value={mediumRisk} icon="🟡" color="warning" />
        <StatCard label="सिङ्क बाँकी" value={pending} icon="☁️" color="muted" />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📋 हालका सर्वेक्षणहरू</h3>
        {loading ? (
          <div className={styles.loadingList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>अहिलेसम्म कुनै सर्वेक्षण छैन।</p>
            <a href="/form" className="btn btn-primary" style={{ marginTop: 16 }}>
              पहिलो सर्वेक्षण सुरु गर्नुहोस्
            </a>
          </div>
        ) : (
          <div className={styles.logList}>
            {logs.slice(0, 20).map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`${styles.statCard} ${styles[`stat_${color}`]}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function LogCard({ log }: { log: HouseholdLog }) {
  const level = getRiskLevel(log.risk_score);
  const color = getRiskColor(level);
  const date = new Date(log.created_at).toLocaleDateString("ne-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className={styles.logCard}>
      <div className={styles.logCardLeft}>
        <div
          className={styles.riskDot}
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <div>
          <div className={styles.logName}>{log.household_name}</div>
          <div className={styles.logMeta}>
            वडा {log.ward_number} · {date}
          </div>
        </div>
      </div>
      <div className={styles.logScore} style={{ color }}>
        {log.risk_score}
        <span className={styles.logScoreMax}>/100</span>
        {!log.synced && <span className={styles.unsyncedDot} title="सिङ्क बाँकी" />}
      </div>
    </div>
  );
}
