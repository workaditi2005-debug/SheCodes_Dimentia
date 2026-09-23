import { useState, useEffect } from "react";
import { DarkCard, Btn } from "../components/RiskDashboard";
import { getGameStats, getMyResults, getMyActivityLevel, getUser } from "../services/api";
import { useAssessment } from "../context/AssessmentContext";
import { useI18n } from "../i18n/LanguageContext";
import { registerVoiceContext } from "../utils/voiceDispatcher";
import { useVoicePageAnnouncer } from "../hooks/useVoicePageAnnouncer";

const LIME = "#2A8F8A";

// Level configurations and game mapping (Strict segregation)
export const LEVEL_DEFINITIONS = {
  1: {
    levelNumber: "Level 1",
    badgeLabel: "🟢 LEVEL 1",
    badgeTitle: "Gentle Stimulation & Guided Engagement",
    color: "#059669",
    accentLight: "#ECFDF5",
    accentBorder: "#A7F3D0",
    description: "High sensory engagement, simple interactions, familiar themes, audio-first.",
    gameIds: ["voice_village", "memory_match", "daily_routine", "rhythm_recall"],
  },
  2: {
    levelNumber: "Level 2",
    badgeLabel: "🟡 LEVEL 2",
    badgeTitle: "Moderate Engagement & Pattern Recognition",
    color: "#D97706",
    accentLight: "#FFFBEB",
    accentBorder: "#FDE68A",
    description: "Structured cognitive tasks, pattern recognition, gentle challenges.",
    gameIds: ["sequence_recall", "object_recognition", "voice_village", "pattern_completion"],
  },
  3: {
    levelNumber: "Level 3",
    badgeLabel: "🔵 LEVEL 3",
    badgeTitle: "Active Cognitive Exercises",
    color: "#2563EB",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
    description: "Multi-step tasks, reaction speed, complex recall, independent play.",
    gameIds: ["sequence_recall", "pattern_completion", "memory_match", "object_recognition"],
  },
};

// Master games metadata dictionary
const ALL_GAMES = {
  memory_match: {
    id: "memory_match",
    page: "game-match",
    title: "Memory Match",
    level3Title: "Simplified Memory Match",
    domain: "Visuospatial & Memory",
    icon: "🃏",
    color: "#059669",
    bgColor: "#ECFDF5",
    desc: "Practice recognition and visual memory with familiar pairs.",
    level3Desc: "Simple, gentle picture matching with familiar everyday items.",
  },
  sequence_recall: {
    id: "sequence_recall",
    page: "game-sequence",
    title: "Sequence Recall",
    domain: "Working Memory & Concentration",
    icon: "🔢",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    desc: "Remember and repeat the sequence as each colorful item lights up.",
  },
  pattern_completion: {
    id: "pattern_completion",
    page: "game-pattern",
    title: "Pattern Completion",
    domain: "Executive Function & Patterns",
    icon: "🧩",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    desc: "Look at the pattern and discover the missing piece.",
  },
  object_recognition: {
    id: "object_recognition",
    page: "game-object",
    title: "Object Recognition",
    domain: "Visual & Semantic Recognition",
    icon: "🔍",
    color: "#D97706",
    bgColor: "#FFFBEB",
    desc: "Recognize familiar cultural objects and traditional heritage items.",
  },
  daily_routine: {
    id: "daily_routine",
    page: "game-routine",
    title: "Daily Routine Planner",
    domain: "Daily Routine & Orientation",
    icon: "🌅",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    desc: "Practice everyday routines from morning tea to night rest.",
  },
  rhythm_recall: {
    id: "rhythm_recall",
    page: "game-rhythm-recall",
    title: "Rhythm & Recall",
    domain: "Music & Auditory Memory",
    icon: "🎵",
    color: "#DB2777",
    bgColor: "#FDF2F8",
    desc: "Use music, familiar songs, and gentle rhythms for meaningful engagement.",
  },
  voice_village: {
    id: "voice_village",
    page: "game-village",
    title: "Voice of the Village",
    domain: "Auditory Memory & Recall",
    icon: "🌾",
    color: "#059669",
    bgColor: "#ECFDF5",
    desc: "Listen to short peaceful village stories and recall simple details.",
  },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function CognitiveGamesHub({ setPage }) {
  const { t, language } = useI18n();
  const { completedCount, apiResult } = useAssessment();

  const [loading, setLoading] = useState(true);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [activityLevel, setActivityLevel] = useState(null);

  const currentUser = getUser();
  const firstName = currentUser?.full_name?.split(" ")[0] || "Friend";

  // Check assessment completion and caregiver assigned level on mount
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      setLoading(true);
      try {
        const [resultsData, levelData] = await Promise.all([
          getMyResults().catch(() => []),
          getMyActivityLevel().catch(() => ({})),
        ]);

        if (!isMounted) return;

        const resultsList = Array.isArray(resultsData) ? resultsData : [];
        const finished = resultsList.length > 0 || completedCount >= 5 || !!apiResult;
        setHasCompletedAssessment(finished);

        // Caregiver assigned level (from endpoint or cached user profile)
        const assignedLvl = levelData?.activity_level || currentUser?.activity_level || null;
        setActivityLevel(assignedLvl ? Number(assignedLvl) : null);
      } catch (err) {
        if (!isMounted) return;
        const fallbackFinished = completedCount >= 5 || !!apiResult;
        setHasCompletedAssessment(fallbackFinished);
        const fallbackLvl = currentUser?.activity_level || null;
        setActivityLevel(fallbackLvl ? Number(fallbackLvl) : null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkStatus();
    return () => { isMounted = false; };
  }, [completedCount, apiResult]);

  // Determine current state:
  // STATE A: Assessment NOT completed
  // STATE B: Assessment completed BUT caregiver has NOT assigned level
  // STATE C: Caregiver HAS assigned level (1, 2, or 3)
  const isStateA = !hasCompletedAssessment;
  const isStateB = hasCompletedAssessment && (!activityLevel || !LEVEL_DEFINITIONS[activityLevel]);
  const isStateC = hasCompletedAssessment && activityLevel && !!LEVEL_DEFINITIONS[activityLevel];

  const currentLevelConfig = isStateC ? LEVEL_DEFINITIONS[activityLevel] : null;
  const assignedGames = isStateC
    ? currentLevelConfig.gameIds.map(id => {
        const game = ALL_GAMES[id];
        if (activityLevel === 3 && id === "memory_match") {
          return {
            ...game,
            title: game.level3Title || game.title,
            desc: game.level3Desc || game.desc,
          };
        }
        return game;
      }).filter(Boolean)
    : [];

  // Voice command dispatcher for active games
  useEffect(() => {
    if (!isStateC || assignedGames.length === 0) return;

    const gameOptions = assignedGames.map(g => ({ id: g.page, label: g.title }));
    const unregister = registerVoiceContext("games_hub", (rawText) => {
      const text = rawText.toLowerCase();
      const matched = assignedGames.find(g =>
        text.includes(g.title.toLowerCase()) ||
        text.includes(g.id.toLowerCase().replace("_", " "))
      );
      if (matched) {
        setPage(matched.page);
        return { handled: true, speakText: `Starting ${matched.title}.` };
      }
      return false;
    }, gameOptions);

    return unregister;
  }, [isStateC, assignedGames, setPage]);

  // Voice announcement
  const langCode = (language || "en-IN").split("-")[0].toLowerCase();
  const announcement = isStateA
    ? [
        langCode === "hi"
          ? "कृपया पहले अपना संज्ञानात्मक मूल्यांकन पूरा करें।"
          : "Please complete your cognitive assessment first. Your activities will appear after your caregiver assigns your support level.",
      ]
    : isStateB
    ? [
        langCode === "hi"
          ? "आपका मूल्यांकन पूरा हो गया है। देखभालकर्ता जल्द ही आपकी गतिविधियाँ चुनेंगे।"
          : "Your assessment is completed. Your caregiver will assign the best activities for you shortly.",
      ]
    : [
        `Good day, ${firstName}! Here are your ${assignedGames.length} cognitive activities for today.`,
        `Your activities are: ${assignedGames.map(g => g.title).join(", ")}.`,
        "Tap or say the name of the activity you want to start.",
      ];

  useVoicePageAnnouncer(null, announcement);

  if (loading) {
    return (
      <div style={{ maxWidth: 760, margin: "60px auto", textAlign: "center", color: "#5C7382", fontSize: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <div>Loading your activities…</div>
      </div>
    );
  }

  // =========================================================================
  // STATE A: ASSESSMENT NOT COMPLETED
  // =========================================================================
  if (isStateA) {
    return (
      <main style={{ maxWidth: 780, margin: "20px auto 40px", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(42,143,138,0.12)",
              border: `1.5px solid ${LIME}44`,
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 800,
              color: LIME,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            <span>🧠</span> Cognitive Activities
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, color: "#1C2F3A", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
            Brain Games
          </h1>
        </div>

        {/* Locked Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "2px solid #E2E8F0",
            borderRadius: 24,
            padding: "44px 32px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#F1F5F9",
              border: "2px solid #CBD5E1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              margin: "0 auto 20px",
            }}
          >
            🔒
          </div>

          <div
            style={{
              display: "inline-block",
              background: "#FEE2E2",
              color: "#B91C1C",
              border: "1px solid #FCA5A5",
              padding: "6px 18px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 16,
            }}
          >
            🔒 Brain Games Locked
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1C2F3A", margin: "0 0 12px" }}>
            Brain Games Locked
          </h2>

          <p style={{ color: "#475569", fontSize: 16, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 32px" }}>
            Please complete your cognitive assessment before starting activities. Your assessment helps your caregiver understand which activities are most appropriate for you.
          </p>

          <button
            onClick={() => setPage("assessments")}
            style={{
              background: "linear-gradient(135deg, #2A8F8A, #1F716D)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 16,
              padding: "16px 36px",
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(42,143,138,0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <span>Complete Assessment</span>
            <span style={{ fontSize: 20 }}>→</span>
          </button>
        </div>
      </main>
    );
  }

  // =========================================================================
  // STATE B: ASSESSMENT COMPLETED BUT CAREGIVER HAS NOT ASSIGNED LEVEL
  // =========================================================================
  if (isStateB) {
    return (
      <main style={{ maxWidth: 780, margin: "20px auto 40px", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(42,143,138,0.12)",
              border: `1.5px solid ${LIME}44`,
              borderRadius: 999,
              padding: "6px 16px",
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 800,
              color: LIME,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            <span>🧠</span> Brain Games
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900, color: "#1C2F3A", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Cognitive Activities
          </h1>
        </div>

        {/* State Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "2px solid #E2E8F0",
            borderRadius: 24,
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
        >
          {/* Assessment Completed Header */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#ECFDF5",
              border: "1.5px solid #A7F3D0",
              color: "#065F46",
              borderRadius: 999,
              padding: "8px 20px",
              fontSize: 15,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 18 }}>✓</span>
            <span>Assessment Completed</span>
          </div>

          <p style={{ color: "#334155", fontSize: 16, fontWeight: 600, margin: "0 0 28px" }}>
            Your assessment has been shared with your caregiver.
          </p>

          <div
            style={{
              background: "#FFFBEB",
              border: "2px solid #FDE68A",
              borderRadius: 20,
              padding: "28px 24px",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#92400E", margin: "0 0 10px" }}>
              Waiting for Caregiver
            </h3>
            <p style={{ color: "#78350F", fontSize: 15, lineHeight: 1.6, margin: "0 0 8px" }}>
              Your activities will appear here after your caregiver selects an activity level.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // STATE C: CAREGIVER HAS ASSIGNED LEVEL -> SHOW ONLY ASSIGNED GAMES
  // =========================================================================
  return (
    <main style={{ maxWidth: 880, margin: "16px auto 60px", padding: "0 16px", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Friendly Patient Greeting Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 900, color: "#1C2F3A", margin: "0 0 8px", letterSpacing: "-0.8px" }}>
          {getGreeting()}, {firstName}! 👋
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#2A8F8A", margin: 0 }}>
              🧠 Your Cognitive Activities
            </h2>
            <p style={{ color: "#475569", fontSize: 15, margin: "4px 0 0" }}>
              Your caregiver has selected these activities for you.
            </p>
          </div>

          {/* Caregiver Assigned Level Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: currentLevelConfig.accentLight,
              border: `1.5px solid ${currentLevelConfig.accentBorder}`,
              borderRadius: 999,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 800,
              color: currentLevelConfig.color,
            }}
          >
            <span>{currentLevelConfig.badgeLabel}</span>
            <span>:</span>
            <span>{currentLevelConfig.badgeTitle}</span>
          </div>
        </div>
      </div>

      {/* 4 Large Elderly-Friendly Game Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {assignedGames.map((game) => (
          <div
            key={game.id}
            style={{
              background: "#FFFFFF",
              border: "2px solid #E2E8F0",
              borderRadius: 24,
              padding: "28px 24px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.04)";
            }}
          >
            <div>
              {/* Game Icon & Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: game.bgColor || "#F1F5F9",
                    border: `1.5px solid ${game.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 34,
                    flexShrink: 0,
                  }}
                >
                  {game.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#1C2F3A",
                      margin: "0 0 4px",
                    }}
                  >
                    {game.title}
                  </h3>
                  <div style={{ fontSize: 13, fontWeight: 700, color: game.color }}>
                    {game.domain}
                  </div>
                </div>
              </div>

              {/* Game Simple Description */}
              <p style={{ color: "#334155", fontSize: 15, lineHeight: 1.5, margin: "0 0 16px" }}>
                {game.desc}
              </p>

              {/* Distinction: Adaptive AI difficulty engine */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#64748B",
                  marginBottom: 20,
                }}
              >
                <span>⚙️</span> Adaptive AI Calibrated
              </div>
            </div>

            {/* Large Friendly Start Button */}
            <button
              onClick={() => setPage(game.page)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #2A8F8A, #1F716D)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 16,
                padding: "15px 24px",
                fontSize: 17,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(42,143,138,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.92"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span>Start Activity</span>
              <span style={{ fontSize: 20 }}>→</span>
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
