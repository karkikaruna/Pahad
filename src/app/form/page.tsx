"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { saveLog } from "@/lib/db";
import { calculateRisk } from "@/lib/risk";
import { generateNepaliExplanation } from "@/lib/gemini";
import { triggerHighRiskNotification } from "@/lib/sync";
import type { HouseholdLogInput } from "@/types";
import styles from "./form.module.css";

type Step = "info" | "questions" | "result";

const QUESTIONS = [
  {
    key: "sleep_change" as const,
    label: "निद्राको समस्या",
    description: "सामान्यभन्दा धेरै वा कम सुत्ने",
    icon: "😴",
  },
  {
    key: "appetite_change" as const,
    label: "भोकको परिवर्तन",
    description: "खाना खान मन नलाग्ने वा धेरै खाने",
    icon: "🍚",
  },
  {
    key: "social_withdrawal" as const,
    label: "समाजबाट अलग्गिएको",
    description: "साथीभाइ र परिवारसँग मिसिन नचाहने",
    icon: "🚶",
  },
  {
    key: "trauma" as const,
    label: "कुनै आघात भएको",
    description: "ठूलो दुर्घटना वा पीडादायी घटना",
    icon: "💔",
  },
  {
    key: "daily_activity_stop" as const,
    label: "दैनिक काम बन्द",
    description: "घरको काम वा व्यवसाय गर्न छोडेको",
    icon: "🛑",
  },
  {
    key: "hopelessness" as const,
    label: "निराशाको भावना",
    description: "भविष्यमा केही राम्रो हुँदैन भन्ने लाग्ने",
    icon: "😔",
  },
  {
    key: "substance_use" as const,
    label: "लागूपदार्थ सेवन",
    description: "मदिरा वा अन्य पदार्थको अत्यधिक सेवन",
    icon: "⚠️",
  },
  {
    key: "self_harm" as const,
    label: "आफूलाई हानि गर्ने विचार",
    description: "आफैंलाई चोट लगाउने वा जीवन समाप्त गर्ने विचार",
    icon: "🆘",
  },
];

const DEFAULT_ANSWERS: Record<string, boolean> = {
  sleep_change: false,
  appetite_change: false,
  social_withdrawal: false,
  trauma: false,
  daily_activity_stop: false,
  hopelessness: false,
  substance_use: false,
  self_harm: false,
};

export default function FormPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { lat, lng, loading: geoLoading, getLocation } = useGeolocation();

  const [step, setStep] = useState<Step>("info");
  const [householdName, setHouseholdName] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [answers, setAnswers] = useState({ ...DEFAULT_ANSWERS });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    explanation: string;
    level: string;
  } | null>(null);
  const [infoError, setInfoError] = useState("");

  const handleInfoNext = () => {
    if (!householdName.trim() || !wardNumber || !respondentName.trim()) {
      setInfoError("कृपया सबै जानकारी भर्नुहोस्");
      return;
    }
    setInfoError("");
    setStep("questions");
  };

  const handleToggle = (key: string) => {
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const input: HouseholdLogInput = {
        household_name: householdName.trim(),
        ward_number: parseInt(wardNumber),
        respondent_name: respondentName.trim(),
        ...answers,
        lat: lat ?? null,
        lng: lng ?? null,
      } as HouseholdLogInput;

      const assessment = calculateRisk(input);
      const explanation = await generateNepaliExplanation(assessment, householdName);

      const log = {
        id: uuidv4(),
        fchv_id: user?.id ?? "unknown",
        ...input,
        risk_score: assessment.score,
        ai_explanation: explanation,
        created_at: new Date().toISOString(),
        synced: false,
      };

      await saveLog(log);

      // Trigger notification if high risk
      if (assessment.score >= 70) {
        await triggerHighRiskNotification(householdName, assessment.score);
      }

      setResult({
        score: assessment.score,
        explanation,
        level: assessment.level,
      });
      setStep("result");
    } catch (error) {
      console.error("Submit error:", error);
      alert("डेटा सुरक्षित गर्न सकिएन। पुनः प्रयास गर्नुहोस्।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep("info");
    setHouseholdName("");
    setWardNumber("");
    setRespondentName("");
    setAnswers({ ...DEFAULT_ANSWERS });
    setResult(null);
    setInfoError("");
  };

  const answeredYes = Object.values(answers).filter(Boolean).length;

  return (
    <div className={styles.page}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width:
              step === "info" ? "33%" : step === "questions" ? "66%" : "100%",
          }}
        />
      </div>

      {/* Step indicators */}
      <div className={styles.steps}>
        {["जानकारी", "प्रश्नहरू", "नतिजा"].map((label, i) => {
          const stepNames: Step[] = ["info", "questions", "result"];
          const isCurrent = stepNames[i] === step;
          const isDone =
            stepNames.indexOf(step) > i;
          return (
            <div
              key={label}
              className={`${styles.stepItem} ${isCurrent ? styles.stepCurrent : ""} ${isDone ? styles.stepDone : ""}`}
            >
              <div className={styles.stepCircle}>{isDone ? "✓" : i + 1}</div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: Household Info */}
      {step === "info" && (
        <div className={styles.section} key="info">
          <h2 className={styles.sectionTitle}>📋 घरपरिवारको जानकारी</h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>घरपरिवारको नाम</label>
            <input
              className="input"
              placeholder="जस्तै: राम बहादुर थापाको घर"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>वडा नम्बर</label>
            <select
              className="input"
              value={wardNumber}
              onChange={(e) => setWardNumber(e.target.value)}
            >
              <option value="">वडा छान्नुहोस्</option>
              {Array.from({ length: 33 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  वडा नम्बर {n}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>उत्तरदाताको नाम</label>
            <input
              className="input"
              placeholder="सर्वेक्षण गरिएको व्यक्तिको नाम"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </div>

          <div className={styles.locationRow}>
            <button
              type="button"
              className={`btn btn-secondary ${styles.locationBtn}`}
              onClick={getLocation}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <>
                  <div className="spinner" />
                  स्थान खोज्दै...
                </>
              ) : lat ? (
                <>✅ स्थान प्राप्त भयो</>
              ) : (
                <>📍 स्थान थप्नुहोस्</>
              )}
            </button>
            {lat && (
              <span className={styles.coordText}>
                {lat.toFixed(4)}, {lng?.toFixed(4)}
              </span>
            )}
          </div>

          {infoError && (
            <div className={styles.errorBox}>⚠️ {infoError}</div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={handleInfoNext}
          >
            अर्को चरण →
          </button>
        </div>
      )}

      {/* STEP 2: Questions */}
      {step === "questions" && (
        <div className={styles.section} key="questions">
          <h2 className={styles.sectionTitle}>
            🏠 {householdName}
          </h2>
          <p className={styles.sectionSubtitle}>
            तलका लक्षणहरू देखिन्छन् भने <strong>हो</strong> थिच्नुहोस्
          </p>

          <div className={styles.questionList}>
            {QUESTIONS.map((q) => (
              <QuestionCard
                key={q.key}
                question={q}
                value={answers[q.key]}
                onChange={() => handleToggle(q.key)}
              />
            ))}
          </div>

          <div className={styles.answerSummary}>
            {answeredYes} / {QUESTIONS.length} लक्षण पहिचान भयो
          </div>

          <div className={styles.buttonRow}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep("info")}
              style={{ flex: 1 }}
            >
              ← पछाडि
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" />
                  विश्लेषण हुँदैछ...
                </>
              ) : (
                "✅ सुरक्षित गर्नुहोस्"
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === "result" && result && (
        <ResultView
          score={result.score}
          level={result.level}
          explanation={result.explanation}
          householdName={householdName}
          onNewSurvey={handleReset}
          onGoHome={() => router.push("/dashboard")}
        />
      )}
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: (typeof QUESTIONS)[0];
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className={`${styles.questionCard} ${value ? styles.questionCardActive : ""}`}
      onClick={onChange}
      role="checkbox"
      aria-checked={value}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onChange()}
    >
      <div className={styles.questionIcon}>{question.icon}</div>
      <div className={styles.questionText}>
        <div className={styles.questionLabel}>{question.label}</div>
        <div className={styles.questionDesc}>{question.description}</div>
      </div>
      <div className={`${styles.toggle} ${value ? styles.toggleOn : ""}`}>
        <div className={styles.toggleThumb} />
      </div>
    </div>
  );
}

function ResultView({
  score,
  level,
  explanation,
  householdName,
  onNewSurvey,
  onGoHome,
}: {
  score: number;
  level: string;
  explanation: string;
  householdName: string;
  onNewSurvey: () => void;
  onGoHome: () => void;
}) {
  const colorMap: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  const labelMap: Record<string, string> = {
    critical: "अत्यन्त उच्च जोखिम",
    high: "उच्च जोखिम",
    medium: "मध्यम जोखिम",
    low: "कम जोखिम",
  };

  const color = colorMap[level] ?? "#22c55e";
  const label = labelMap[level] ?? level;
  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.resultSection}>
      <h2 className={styles.sectionTitle}>📊 नतिजा</h2>
      <p className={styles.resultName}>{householdName}</p>

      <div className={styles.scoreRing}>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <text x="50" y="46" textAnchor="middle" fill={color} fontSize="22" fontWeight="800">
            {score}
          </text>
          <text x="50" y="62" textAnchor="middle" fill="#64748b" fontSize="10">
            / 100
          </text>
        </svg>
      </div>

      <div className={styles.riskBadge} style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}>
        {label}
      </div>

      {score >= 70 && (
        <div className={styles.alertBox}>
          🆘 तत्काल ध्यान आवश्यक! स्वास्थ्य अधिकारीलाई सूचित गर्नुहोस्।
        </div>
      )}

      <div className={styles.explanationCard}>
        <h3 className={styles.explanationTitle}>💬 विश्लेषण</h3>
        <p className={styles.explanationText}>{explanation}</p>
      </div>

      <div className={styles.savedNote}>
        ✅ डेटा सफलतापूर्वक सुरक्षित भयो। इन्टरनेट उपलब्ध भएपछि स्वतः सिङ्क हुनेछ।
      </div>

      <div className={styles.buttonRow}>
        <button className="btn btn-secondary" onClick={onGoHome} style={{ flex: 1 }}>
          🏠 गृहपृष्ठ
        </button>
        <button className="btn btn-primary" onClick={onNewSurvey} style={{ flex: 1 }}>
          ➕ नयाँ सर्वेक्षण
        </button>
      </div>
    </div>
  );
}
