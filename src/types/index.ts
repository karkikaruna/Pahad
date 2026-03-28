export interface HouseholdLog {
  id: string;
  fchv_id: string;
  household_name: string;
  ward_number: number;
  respondent_name: string;
  sleep_change: boolean;
  appetite_change: boolean;
  social_withdrawal: boolean;
  trauma: boolean;
  daily_activity_stop: boolean;
  hopelessness: boolean;
  substance_use: boolean;
  self_harm: boolean;
  risk_score: number;
  ai_explanation: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  synced: boolean;
  sync_error?: string;
}

export interface HouseholdLogInput {
  household_name: string;
  ward_number: number;
  respondent_name: string;
  sleep_change: boolean;
  appetite_change: boolean;
  social_withdrawal: boolean;
  trauma: boolean;
  daily_activity_stop: boolean;
  hopelessness: boolean;
  substance_use: boolean;
  self_harm: boolean;
  lat: number | null;
  lng: number | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  ward: number;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: string[];
}

export interface SyncStatus {
  pending: number;
  lastSync: Date | null;
  isSyncing: boolean;
}
