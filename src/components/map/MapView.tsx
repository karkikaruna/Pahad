"use client";

import { useEffect, useRef } from "react";
import type { HouseholdLog } from "@/types";
import { getRiskColor, getRiskLevel } from "@/lib/risk";

// Nepal center coordinates
const NEPAL_CENTER: [number, number] = [28.3949, 84.124];
const DEFAULT_ZOOM = 7;

interface MapViewProps {
  logs: HouseholdLog[];
}

export default function MapView({ logs }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: NEPAL_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      addMarkers(L, map, logs);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when logs change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      addMarkers(L, mapInstanceRef.current, logs);
    });
  }, [logs]);

  function addMarkers(L: any, map: any, logs: HouseholdLog[]) {
    logs.forEach((log) => {
      if (!log.lat || !log.lng) return;

      const level = getRiskLevel(log.risk_score);
      const color = getRiskColor(level);

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${color}80;
            cursor: pointer;
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const date = new Date(log.created_at).toLocaleDateString("ne-NP");

      const popup = L.popup({
        maxWidth: 280,
        className: "pahad-popup",
      }).setContent(`
        <div style="
          font-family: 'Mukta', sans-serif;
          padding: 4px;
          min-width: 200px;
        ">
          <div style="font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: #1e293b;">
            ${log.household_name}
          </div>
          <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">
            वडा ${log.ward_number} · ${date}
          </div>
          <div style="
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            background: ${color}20;
            color: ${color};
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 10px;
            border: 1px solid ${color}40;
          ">
            जोखिम: ${log.risk_score}/100
          </div>
          <div style="font-size: 0.82rem; color: #475569; line-height: 1.5;">
            ${log.ai_explanation.slice(0, 120)}...
          </div>
        </div>
      `);

      const marker = L.marker([log.lat, log.lng], { icon }).addTo(map).bindPopup(popup);

      markersRef.current.push(marker);
    });

    // If we have logs with coordinates, fit bounds
    if (logs.filter((l) => l.lat && l.lng).length > 0) {
      const points = logs
        .filter((l) => l.lat && l.lng)
        .map((l) => [l.lat!, l.lng!] as [number, number]);

      try {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
      } catch {
        // Keep default view if fitBounds fails
      }
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%", minHeight: 420 }}
      />
    </>
  );
}
