import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      household_logs: {
        Row: {
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
        };
        Insert: Omit<Database["public"]["Tables"]["household_logs"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
      };
    };
  };
};
