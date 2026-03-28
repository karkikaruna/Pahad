"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { signIn, session, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("इमेल र पासवर्ड आवश्यक छ");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError("इमेल वा पासवर्ड गलत छ। पुनः प्रयास गर्नुहोस्।");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("सर्भरसँग जडान हुन सकिएन। इन्टरनेट जाँच गर्नुहोस्।");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.background}>
        <div className={styles.mountainSvg}>
          <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <polygon points="0,200 80,60 160,120 240,30 320,100 400,50 400,200" fill="rgba(16,185,129,0.08)" />
            <polygon points="0,200 60,90 140,140 220,50 300,110 380,70 400,80 400,200" fill="rgba(16,185,129,0.05)" />
          </svg>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.logoBlock}>
          <div className={styles.logoIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="rgba(16,185,129,0.15)" />
              <path d="M24 8 L38 34 L10 34 Z" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M18 34 L24 20 L30 34" fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round"/>
              <circle cx="24" cy="16" r="2" fill="#10b981"/>
            </svg>
          </div>
          <h1 className={styles.appName}>पहाड</h1>
          <p className={styles.tagline}>मानसिक स्वास्थ्य अनुगमन प्रणाली</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">
              📧 इमेल ठेगाना
            </label>
            <input
              id="email"
              type="email"
              className={`input ${styles.formInput}`}
              placeholder="aapno@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">
              🔒 पासवर्ड
            </label>
            <input
              id="password"
              type="password"
              className={`input ${styles.formInput}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                प्रवेश हुँदैछ...
              </>
            ) : (
              "🏔️ प्रवेश गर्नुहोस्"
            )}
          </button>
        </form>

        <p className={styles.footer}>
          केवल अधिकृत स्वास्थ्य स्वयंसेवकहरूको लागि
        </p>
      </div>
    </div>
  );
}
