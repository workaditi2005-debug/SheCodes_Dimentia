import React, { useState } from "react";
import RhythmRecallHome from "./RhythmRecallHome";
import SongRecognition from "./SongRecognition";
import MemoryConnection from "./MemoryConnection";
import SessionSummary from "./SessionSummary";
import MusicPreferences from "./MusicPreferences";
import { DEMO_SONGS } from "./musicData";
import { getRhythmMusicPersonalized, saveRhythmSession } from "../../../services/api";

export default function RhythmRecall({ setPage }) {
  const [view, setView] = useState("home"); // "home" | "game" | "summary" | "preferences"
  const [selectedMode, setSelectedMode] = useState(null);
  const [tracks, setTracks] = useState(DEMO_SONGS);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [musicError, setMusicError] = useState("");

  const handleSelectMode = async (modeId) => {
    setSelectedMode(modeId);
    setLoadingMusic(true);
    setMusicError("");
    try {
      const res = await getRhythmMusicPersonalized();
      if (res && res.tracks && res.tracks.length > 0) {
        setTracks(res.tracks);
      } else {
        setTracks(DEMO_SONGS);
      }
      setView("game");
    } catch (err) {
      console.warn("Failed to load personalized music, using fallback demo songs:", err);
      setTracks(DEMO_SONGS);
      setView("game");
    } finally {
      setLoadingMusic(false);
    }
  };

  const handleFinishGame = async (gameResults) => {
    const payload = {
      client_action_id: crypto.randomUUID(),
      mode: selectedMode || "recognition",
      music_ids: gameResults.music_ids || tracks.map((t) => t.music_id),
      duration_seconds: gameResults.duration_seconds || 60,
      recognition_correct: gameResults.recognition_correct || 0,
      recognition_total: gameResults.recognition_total || 0,
      tap_count: 0,
      rhythm_engagement_pct: null,
      voice_participated: false,
      voice_duration_seconds: 0,
      memory_responses: gameResults.memory_responses || [],
      mood_responses: gameResults.mood_responses || [],
      rounds: gameResults.rounds || [],
    };

    try {
      const savedSession = await saveRhythmSession(payload);
      setSessionSummary(savedSession);
    } catch (err) {
      console.warn("Failed to save session, displaying optimistic summary:", err);
      setSessionSummary({
        ...payload,
        session_id: "local-" + Date.now(),
        engagement_label: "Wonderful participation today!",
        encouragement: "🎵 Music brings joy — great session!",
      });
    }
    setView("summary");
  };

  const handleBackToHome = () => {
    setView("home");
    setSelectedMode(null);
  };

  const handleBackToHub = () => {
    if (setPage) {
      setPage("games");
    } else {
      setView("home");
    }
  };

  // Render Preferences View
  if (view === "preferences") {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 48px" }}>
        <MusicPreferences
          onBack={handleBackToHome}
          onSaved={handleBackToHome}
        />
      </div>
    );
  }

  // Render Session Summary View
  if (view === "summary" && sessionSummary) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 48px" }}>
        <SessionSummary
          sessionData={sessionSummary}
          onPlayAgain={() => handleSelectMode(selectedMode)}
          onHome={handleBackToHome}
          onBackToHub={handleBackToHub}
        />
      </div>
    );
  }

  // Render Active Game View
  if (view === "game") {
    if (loadingMusic) {
      return (
        <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, border: "4px solid rgba(42,143,138,0.2)", borderTopColor: "#2A8F8A", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1C2F3A" }}>Preparing Personalized Music Session...</h2>
          <p style={{ color: "#5C7382", fontSize: 16, marginTop: 8 }}>Selecting songs based on regional and nostalgia preferences.</p>
        </div>
      );
    }

    if (musicError && (!tracks || tracks.length === 0)) {
      return (
        <div style={{ minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1C2F3A" }}>{musicError}</h2>
          <button
            onClick={handleBackToHome}
            style={{
              padding: "14px 28px",
              background: "#2A8F8A",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 16,
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Music Hub
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "16px 16px 48px" }}>
        {selectedMode === "recognition" && (
          <SongRecognition
            tracks={tracks}
            onComplete={handleFinishGame}
            onBack={handleBackToHome}
          />
        )}
        {selectedMode === "memory_connection" && (
          <MemoryConnection
            tracks={tracks}
            onComplete={handleFinishGame}
            onBack={handleBackToHome}
          />
        )}
      </div>
    );
  }

  // Default: Landing / Mode Select View
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 16px 48px" }}>
      {/* Top Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(28,58,68,0.10)", paddingBottom: 16, marginBottom: 28 }}>
        <button
          onClick={handleBackToHub}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            color: "#1C2F3A",
            background: "#FFFFFF",
            border: "1.5px solid rgba(28,58,68,0.14)",
            padding: "10px 18px",
            borderRadius: 14,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(28,47,58,0.04)",
          }}
        >
          ← Back to Brain Games
        </button>
        <button
          onClick={() => setView("preferences")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            color: "#1B6360",
            background: "#FFFFFF",
            border: "1.5px solid #2A8F8A",
            padding: "10px 18px",
            borderRadius: 14,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(28,47,58,0.04)",
          }}
        >
          ⚙️ Music Preferences
        </button>
      </div>

      {/* Main Home Grid */}
      <RhythmRecallHome onSelectMode={handleSelectMode} />
    </div>
  );
}
