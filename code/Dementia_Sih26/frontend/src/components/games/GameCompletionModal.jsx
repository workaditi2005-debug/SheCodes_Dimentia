import { useEffect } from "react";
import { playCelebrationSound } from "../../utils/gameAudio";

const LIME = "#2A8F8A";

export default function GameCompletionModal({
  isOpen,
  result,
  onPlayAgain,
  onExit,
  gameTitle = "Cognitive Game",
}) {
  useEffect(() => {
    if (isOpen) {
      playCelebrationSound();
    }
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const stars = result.stars || 3;
  const score = Math.round(result.score || 85);
  const timeSec = Math.round(result.duration_seconds || result.duration || 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(28,47,58,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#FFFFFF",
          border: `1.5px solid rgba(28,58,68,0.12)`,
          borderRadius: 28,
          padding: "36px 28px",
          textAlign: "center",
          boxShadow: `0 24px 64px rgba(28,47,58,0.18), 0 0 40px rgba(42,143,138,0.12)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top celebratory glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            height: 120,
            background: `radial-gradient(circle, rgba(42,143,138,0.18) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Cognitive Domain Tag */}
        {result.cognitive_domain && (
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(42,143,138,0.10)",
              border: `1px solid rgba(42,143,138,0.25)`,
              fontSize: 12,
              fontWeight: 800,
              color: LIME,
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            ✦ {result.cognitive_domain}
          </div>
        )}

        {/* Title */}
        <h2
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 900,
            fontSize: 28,
            color: "#1C2F3A",
            marginBottom: 6,
          }}
        >
          Session Completed!
        </h2>
        <p style={{ color: "#5C7382", fontSize: 15, marginBottom: 20, fontWeight: 500 }}>
          {gameTitle}
        </p>

        {/* Star Rating Display */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3].map((starIndex) => {
            const isFilled = starIndex <= stars;
            return (
              <span
                key={starIndex}
                style={{
                  fontSize: 48,
                  filter: isFilled
                    ? "drop-shadow(0 0 16px #fbbf24)"
                    : "grayscale(100%) opacity(25%)",
                  transform: isFilled ? "scale(1.1)" : "scale(0.9)",
                  transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  display: "inline-block",
                }}
              >
                ⭐
              </span>
            );
          })}
        </div>

        {/* Encouraging Feedback Message */}
        <div
          style={{
            background: "#F7FAF9",
            border: "1px solid rgba(28,58,68,0.10)",
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 16,
              color: "#1C2F3A",
              lineHeight: 1.5,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {result.feedback_message || "Wonderful job! Regular cognitive stimulation helps maintain mental sharpness."}
          </p>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: "#F8FAFA",
              border: "1px solid rgba(28,58,68,0.10)",
              borderRadius: 14,
              padding: "12px 8px",
            }}
          >
            <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>
              Score
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: LIME }}>
              {score}%
            </div>
          </div>

          <div
            style={{
              background: "#F8FAFA",
              border: "1px solid rgba(28,58,68,0.10)",
              borderRadius: 14,
              padding: "12px 8px",
            }}
          >
            <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>
              Duration
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#3A7CA5" }}>
              {timeSec}s
            </div>
          </div>

          <div
            style={{
              background: "#F8FAFA",
              border: "1px solid rgba(28,58,68,0.10)",
              borderRadius: 14,
              padding: "12px 8px",
            }}
          >
            <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>
              Rating
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#C4842A" }}>
              {stars}/3 Stars
            </div>
          </div>
        </div>

        {/* Adaptive Difficulty Adjustment & Explainability */}
        {result.adaptive_difficulty && (
          <div
            style={{
              background: "rgba(42,143,138,0.06)",
              border: "1px solid rgba(42,143,138,0.22)",
              borderRadius: 18,
              padding: "16px 18px",
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🧠</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: LIME, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Adaptive Engine Recommendation
                </span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background:
                    result.adaptive_difficulty.adjustment === "increase"
                      ? "rgba(47,158,122,0.15)"
                      : result.adaptive_difficulty.adjustment === "decrease"
                      ? "rgba(58,124,165,0.15)"
                      : "rgba(196,132,42,0.15)",
                  color:
                    result.adaptive_difficulty.adjustment === "increase"
                      ? "#2F9E7A"
                      : result.adaptive_difficulty.adjustment === "decrease"
                      ? "#3A7CA5"
                      : "#C4842A",
                  border: "1px solid currentColor",
                }}
              >
                Level {result.adaptive_difficulty.previous_level} → Level {result.adaptive_difficulty.new_level}
              </span>
            </div>

            {/* Explainability Reasons */}
            {result.adaptive_difficulty.reason && result.adaptive_difficulty.reason.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {result.adaptive_difficulty.reason.map((r, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1C2F3A",
                      background: "#FFFFFF",
                      border: "1px solid rgba(28,58,68,0.15)",
                      borderRadius: 8,
                      padding: "4px 10px",
                    }}
                  >
                    ✓ {r}
                  </span>
                ))}
              </div>
            )}

            {result.adaptive_difficulty.clinical_rationale && (
              <div style={{ fontSize: 12, color: "#5C7382", marginTop: 8, fontStyle: "italic" }}>
                {result.adaptive_difficulty.clinical_rationale}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
          {result.adaptive_difficulty && result.adaptive_difficulty.new_level !== result.adaptive_difficulty.previous_level ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  if (onPlayAgain) onPlayAgain(result.adaptive_difficulty.new_level);
                }}
                style={{
                  flex: 1.3,
                  padding: "16px 14px",
                  borderRadius: 16,
                  background: LIME,
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: `0 4px 16px rgba(42,143,138,0.3)`,
                  transition: "transform 0.15s ease",
                }}
              >
                Play Level {result.adaptive_difficulty.new_level} 🚀
              </button>
              <button
                onClick={() => {
                  if (onPlayAgain) onPlayAgain(result.adaptive_difficulty.previous_level);
                }}
                style={{
                  flex: 0.9,
                  padding: "16px 12px",
                  borderRadius: 16,
                  background: "#FFFFFF",
                  border: "1px solid rgba(28,58,68,0.18)",
                  color: "#1C2F3A",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Replay Lvl {result.adaptive_difficulty.previous_level} ↻
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const nextLvl = result.adaptive_difficulty?.new_level;
                if (onPlayAgain) onPlayAgain(nextLvl);
              }}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: 16,
                background: LIME,
                border: "none",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: `0 4px 16px rgba(42,143,138,0.3)`,
                transition: "transform 0.15s ease",
              }}
            >
              Play Again ↻
            </button>
          )}

          <button
            onClick={onExit}
            style={{
              width: "100%",
              padding: "12px 18px",
              borderRadius: 14,
              background: "transparent",
              border: "1px solid rgba(28,58,68,0.15)",
              color: "#5C7382",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            ← Back to Brain Games
          </button>
        </div>
      </div>
    </div>
  );
}
