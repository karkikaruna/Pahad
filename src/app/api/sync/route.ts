import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { logs } = body as { logs: any[] };

    if (!Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    // Validate each log belongs to the authenticated user
    const validLogs = logs
      .filter((log) => log.fchv_id === user.id)
      .map(({ synced, sync_error, ...rest }) => rest);

    const { data, error } = await supabase
      .from("household_logs")
      .upsert(validLogs, { onConflict: "id" })
      .select("id");

    if (error) {
      console.error("Sync error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      synced: data?.length ?? 0,
      ids: data?.map((r: any) => r.id) ?? [],
    });
  } catch (error) {
    console.error("Sync route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
