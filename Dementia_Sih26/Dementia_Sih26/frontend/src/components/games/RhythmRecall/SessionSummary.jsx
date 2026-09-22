/**
 * SessionSummary.jsx — Rhythm & Recall Session Complete Screen
 * =============================================================
 * Positive, encouraging session summary.
 * Displays engagement metrics for the active modes:
 *  1. Song Recognition 🎶
 *  2. Memory Association ❤️
 * Elder-friendly: large text, stars, warm encouragement.
 */
import { useEffect } from "react";
import { playCelebrationSound } from "../../../utils/gameAudio";
import { useI18n } from "../../../i18n/LanguageContext";

const LIME = "#2A8F8A";
const TEAL = "#34d399";
const PINK = "#f472b6";

const MOOD_EMOJI_MAP = {
  happy: "😊",
  calm: "😌",
  familiar: "❤️",
  neutral: "😐",
  uncomfortable: "😟",
};

const MEMORY_LABEL_MAP = {
  home: "Home 🏠",
  radio: "Radio 📻",
  festival: "Festival 🎉",
  family: "Family 👨‍👩‍👧",
  school: "School 🏫",
  dont_remember: "Not sure ❓",
};

function getStars(recognitionPct) {
  if (recognitionPct === null || recognitionPct === undefined) return 3;
  if (recognitionPct >= 80) return 3;
  if (recognitionPct >= 50) return 2;
  return 2;
}

export default function SessionSummary({ sessionData, onPlayAgain, onHome, onBackToHub }) {
  const { t } = useI18n();

  useEffect(() => {
    playCelebrationSound();
  }, []);

  const {
    recognition_correct = 0,
    recognition_total = 0,
    duration_seconds = 60,
    mood_responses = [],
    memory_responses = [],
  } = sessionData || {};

  const stars = getStars(
    recognition_total > 0 ? (recognition_correct / recognition_total) * 100 : null
  );
  const durationMin = duration_seconds ? Math.max(1, Math.round(duration_seconds / 60)) : 1;
  const recognitionDisplay =
    recognition_total > 0 ? `${recognition_correct} / ${recognition_total}` : "—";
  const moodEmojis = mood_responses.map((m) => MOOD_EMOJI_MAP[m] || m).join("  ");

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        paddingBottom: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header glow */}
      <div
        style={{
          width: "100%",
          background: "#FFFFFF",
          border: `1.5px solid rgba(28,58,68,0.12)`,
          borderRadius: 28,
          padding: "40px 32px 32px",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(28,47,58,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎵</div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(26px, 5vw, 38px)",
            color: "#1C2F3A",
            marginBottom: 8,
          }}
        >
          {t("rrSessionComplete", "Session Complete!")} 🌟
        </h1>

        {/* Stars */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              style={{
                fontSize: 48,
                filter: i <= stars ? "drop-shadow(0 2px 8px rgba(217,119,6,0.4))" : "grayscale(100%) opacity(25%)",
                transform: i <= stars ? "scale(1.1)" : "scale(0.9)",
                display: "inline-block",
              }}
              aria-hidden="true"
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Encouragement */}
        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "#1C2F3A",
            lineHeight: 1.6,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          {t("rrEncouragement", "🌟 Wonderful participation today! Music brings joy.")}
        </p>

        {/* Metrics grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {recognition_total > 0 && (
            <MetricTile
              icon="🎶"
              label={t("rrSongRecognition", "Song Recognition")}
              value={recognitionDisplay}
              color="#0F766E"
            />
          )}
          <MetricTile
            icon="⏱"
            label={t("rrSessionDuration", "Session Duration")}
            value={`${durationMin} ${t("rrMin", "min")}`}
            color="#2A8F8A"
          />
        </div>

        {/* Mood responses */}
        {moodEmojis && (
          <div
            style={{
              background: "#F4F8F8",
              border: "1px solid rgba(28,58,68,0.08)",
              borderRadius: 14,
              padding: "14px 18px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
              {t("rrMoodResponse", "Mood Response")}
            </div>
            <div style={{ fontSize: 32 }}>{moodEmojis}</div>
          </div>
        )}

        {/* Memory responses */}
        {memory_responses.length > 0 && (
          <div
            style={{
              background: "#FDF2F8",
              border: "1px solid rgba(217,70,239,0.25)",
              borderRadius: 14,
              padding: "14px 18px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
              {t("rrMemoryAssociation", "Memory Association")}
            </div>
            <div style={{ color: "#1C2F3A", fontWeight: 700, fontSize: 16 }}>
              {memory_responses.map((r) => MEMORY_LABEL_MAP[r] || r).join(", ")}
            </div>
          </div>
        )}

        {/* Actions */}
        <p style={{ color: "#5C7382", fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          {t("rrPlayAgainQuestion", "Great job! Would you like to play another session?")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <button
            onClick={onPlayAgain}
            aria-label="Play another music session"
            style={{
              padding: "18px 24px",
              borderRadius: 18,
              background: "#2A8F8A",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "clamp(17px, 3vw, 22px)",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(42,143,138,0.25)",
              width: "100%",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
          >
            🎵 {t("rrPlayAgain", "PLAY AGAIN")}
          </button>

          <button
            onClick={onHome || onBackToHub}
            aria-label="Finish and go back to Games"
            style={{
              padding: "16px 24px",
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1.5px solid rgba(28,58,68,0.14)",
              color: "#1C2F3A",
              fontWeight: 800,
              fontSize: "clamp(15px, 2.5vw, 19px)",
              cursor: "pointer",
              width: "100%",
              boxShadow: "0 2px 8px rgba(28,47,58,0.04)",
            }}
          >
            ✓ {t("rrDone", "DONE — Back to Menu")}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "#F4F8F8",
        border: "1px solid rgba(28,58,68,0.08)",
        borderRadius: 14,
        padding: "14px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 4 }} aria-hidden="true">{icon}</div>
      <div style={{ fontSize: 12, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color }} aria-label={`${label}: ${value}`}>
        {value}
      </div>
    </div>
  );
}
