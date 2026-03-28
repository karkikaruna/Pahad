import type { HouseholdLogInput, RiskAssessment, RiskLevel } from "@/types";

interface RiskFactor {
  key: keyof Pick<
    HouseholdLogInput,
    | "sleep_change"
    | "appetite_change"
    | "social_withdrawal"
    | "trauma"
    | "daily_activity_stop"
    | "hopelessness"
    | "substance_use"
    | "self_harm"
  >;
  weight: number;
  label_ne: string;
}

const RISK_FACTORS: RiskFactor[] = [
  { key: "self_harm", weight: 30, label_ne: "आत्म-हानि" },
  { key: "hopelessness", weight: 20, label_ne: "निराशा" },
  { key: "trauma", weight: 15, label_ne: "आघात" },
  { key: "daily_activity_stop", weight: 12, label_ne: "दैनिक क्रियाकलाप बन्द" },
  { key: "social_withdrawal", weight: 10, label_ne: "सामाजिक अलगाव" },
  { key: "substance_use", weight: 7, label_ne: "लागूपदार्थ सेवन" },
  { key: "sleep_change", weight: 3, label_ne: "निद्रा परिवर्तन" },
  { key: "appetite_change", weight: 3, label_ne: "भोक परिवर्तन" },
];

const TOTAL_MAX_WEIGHT = RISK_FACTORS.reduce((sum, f) => sum + f.weight, 0);

export function calculateRisk(input: HouseholdLogInput): RiskAssessment {
  let rawScore = 0;
  const activeFactors: string[] = [];

  for (const factor of RISK_FACTORS) {
    if (input[factor.key]) {
      rawScore += factor.weight;
      activeFactors.push(factor.label_ne);
    }
  }

  // Normalize to 0–100
  const score = Math.round((rawScore / TOTAL_MAX_WEIGHT) * 100);

  // Apply critical escalation: self_harm alone triggers >= 60
  const normalizedScore =
    input.self_harm && score < 60 ? Math.max(score, 60) : score;

  const level = getRiskLevel(normalizedScore);

  return {
    score: normalizedScore,
    level,
    factors: activeFactors,
  };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "#ef4444";
    case "high":
      return "#f97316";
    case "medium":
      return "#eab308";
    case "low":
      return "#22c55e";
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "अत्यन्त उच्च जोखिम";
    case "high":
      return "उच्च जोखिम";
    case "medium":
      return "मध्यम जोखिम";
    case "low":
      return "कम जोखिम";
  }
}
