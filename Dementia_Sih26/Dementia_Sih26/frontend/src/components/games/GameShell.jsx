import { useState, useEffect, useRef } from "react";
import GameCompletionModal from "./GameCompletionModal";
import { isSoundMuted, setSoundMuted, playTapSound } from "../../utils/gameAudio";

const LIME = "#2A8F8A";

export default function GameShell({
  gameId,
  title,
  domainLabel = "Cognitive Focus",
  accentColor = LIME,
  instructionText = "",
  difficultyLevel = 1,
  onDifficultyChange,
  timerSeconds = 0,
  isTimerRunning = true,
  movesCount = 0,
  mistakesCount = 0,
  onRestart,
  onHint,
  onBack,
  completionResult = null,
  isCompleted = false,
  onPlayAgain,
  children,
}) {
  const [muted, setMuted] = useState(isSoundMuted());

  function handleMuteToggle() {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  }

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 44, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Top Navigation Bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <button
          onClick={() => {
            playTapSound();
            if (onBack) onBack();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid rgba(28,58,68,0.15)",
            color: "#1C2F3A",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(28,47,58,0.04)",
          }}
        >
          ← Exit to Games
        </button>

        {/* Cognitive Domain Tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            borderRadius: 99,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}44`,
            color: accentColor,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          <span>✦</span> {domainLabel}
        </div>

        {/* Sound Toggle Button */}
        <button
          onClick={handleMuteToggle}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#FFFFFF",
            border: "1px solid rgba(28,58,68,0.15)",
            color: "#1C2F3A",
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(28,47,58,0.04)",
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* ── Game Header & Difficulty Select ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(28,58,68,0.12)",
          borderRadius: 22,
          padding: "20px 24px",
          marginBottom: 16,
          boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 900,
                fontSize: "clamp(22px, 3vw, 32px)",
                color: "#1C2F3A",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              {title}
            </h1>
          </div>

          {/* Difficulty Level Tabs */}
          {onDifficultyChange && (
            <div
              style={{
                display: "inline-flex",
                background: "#F0F5F5",
                padding: 4,
                borderRadius: 14,
                border: "1px solid rgba(28,58,68,0.12)",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              {[
                { lvl: 1, label: "Easy" },
                { lvl: 2, label: "Medium" },
                { lvl: 3, label: "Hard" },
                { lvl: 4, label: "Pro" },
                { lvl: 5, label: "Advance" },
              ].map(({ lvl, label }) => {
                const isActive = difficultyLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      playTapSound();
                      onDifficultyChange(lvl);
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: isActive ? accentColor : "transparent",
                      color: isActive ? "#FFFFFF" : "#3D5563",
                      fontWeight: isActive ? 800 : 700,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>Lvl {lvl}</span>
                    <span style={{ fontSize: 10, opacity: isActive ? 0.95 : 0.7 }}>({label})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Metrics Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderTop: "1px solid rgba(28,58,68,0.09)",
            paddingTop: 12,
            fontSize: 14,
            color: "#5C7382",
            fontWeight: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>⏱</span>
            <span style={{ color: "#1C2F3A", fontWeight: 800 }}>
              {formatTime(timerSeconds)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>🎯 Moves:</span>
            <span style={{ color: "#1C2F3A", fontWeight: 800 }}>{movesCount}</span>
          </div>

          {mistakesCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠️ Retries:</span>
              <span style={{ color: "#C45C5C", fontWeight: 800 }}>
                {mistakesCount}
              </span>
            </div>
          )}

          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => {
                playTapSound();
                if (onRestart) onRestart();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#5C7382",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "underline",
              }}
            >
              ↻ Restart
            </button>
          </div>
        </div>
      </div>

      {/* ── Instruction Box ── */}
      {instructionText && (
        <div
          style={{
            background: "rgba(42,143,138,0.08)",
            border: `1px solid ${LIME}33`,
            borderRadius: 16,
            padding: "14px 20px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
          <p
            style={{
              color: "#1C2F3A",
              fontSize: 15,
              lineHeight: 1.5,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {instructionText}
          </p>
          {onHint && (
            <button
              onClick={() => {
                playTapSound();
                onHint();
              }}
              style={{
                marginLeft: "auto",
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 12,
                background: `${LIME}18`,
                border: `1px solid ${LIME}44`,
                color: LIME,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Hint 🔍
            </button>
          )}
        </div>
      )}

      {/* ── Main Game Board Viewport (Light Healthcare Container) ── */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(28,58,68,0.12)",
          borderRadius: 24,
          padding: "32px 24px",
          minHeight: 400,
          boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle top shine */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, #DCE7E8, transparent)", pointerEvents: "none" }} />
        {/* Soft bottom right glow */}
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: "60%", height: "50%",
          background: `radial-gradient(ellipse 80% 80% at 90% 110%, ${LIME}14 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{ width: "100%", position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>

      {/* ── Completion Reward Modal ── */}
      <GameCompletionModal
        isOpen={isCompleted}
        result={completionResult}
        gameTitle={title}
        onPlayAgain={onPlayAgain || onRestart}
        onExit={onBack}
      />
    </div>
  );
}
