import { NextRequest, NextResponse } from "next/server";
import { calculateRisk } from "@/lib/risk";
import type { HouseholdLogInput } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as HouseholdLogInput;

    const required = [
      "household_name",
      "ward_number",
      "respondent_name",
    ];

    for (const field of required) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const assessment = calculateRisk(body);

    return NextResponse.json({
      score: assessment.score,
      level: assessment.level,
      factors: assessment.factors,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
