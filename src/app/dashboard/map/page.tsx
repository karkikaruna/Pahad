"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getAllLogs } from "@/lib/db";
import type { HouseholdLog } from "@/types";
import styles from "./map.module.css";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoading}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p>नक्शा लोड हुँदैछ...</p>
    </div>
  ),
});

export default function MapPage() {
  const [logs, setLogs] = useState<HouseholdLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    getAllLogs()
      .then((data) => setLogs(data.filter((l) => l.lat && l.lng)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "high") return log.risk_score >= 70;
    if (filter === "medium") return log.risk_score >= 25 && log.risk_score < 70;
    if (filter === "low") return log.risk_score < 25;
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>🗺️ जोखिम नक्शा</h2>
        <p className={styles.subtitle}>{filtered.length} घरपरिवार</p>
      </div>

      <div className={styles.filterRow}>
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" && "सबै"}
            {f === "high" && "🔴 उच्च"}
            {f === "medium" && "🟡 मध्यम"}
            {f === "low" && "🟢 कम"}
          </button>
        ))}
      </div>

      <div className={styles.mapWrapper}>
        {loading ? (
          <div className={styles.mapLoading}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
            <p>डेटा लोड हुँदैछ...</p>
          </div>
        ) : (
          <MapView logs={filtered} />
        )}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#ef4444" }} />
          अत्यन्त उच्च (≥70)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#f97316" }} />
          उच्च (50–69)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#eab308" }} />
          मध्यम (25–49)
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "#22c55e" }} />
          कम (&lt;25)
        </div>
      </div>
    </div>
  );
}
