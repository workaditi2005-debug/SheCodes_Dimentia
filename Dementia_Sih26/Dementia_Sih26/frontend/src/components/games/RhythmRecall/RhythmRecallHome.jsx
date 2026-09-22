/**
 * RhythmRecallHome.jsx — Rhythm & Recall Landing Page
 * =====================================================
 * Elder-friendly landing page with 2 active mode cards:
 *  1. Recognize the Song 🎶
 *  2. Memory Connection ❤️
 */
import { useEffect } from "react";
import { useI18n } from "../../../i18n/LanguageContext";
import { registerVoiceContext } from "../../../utils/voiceDispatcher";
import { useVoicePageAnnouncer } from "../../../hooks/useVoicePageAnnouncer";


const TEAL = "#34d399";
const PINK = "#f472b6";

const MODES = [
  {
    id: "recognition",
    icon: "🎶",
    color: TEAL,
    titleKey: "rrRecognizeTitle",
    title: "Recognize the Song",
    descKey: "rrRecognizeDesc",
    desc: "Listen to a song and choose the one you recognize.",
    ariaLabel: "Start Recognize the Song activity",
  },
  {
    id: "memory_connection",
    icon: "❤️",
    color: PINK,
    titleKey: "rrMemoryTitle",
    title: "Memory Connection",
    descKey: "rrMemoryDesc",
    desc: "Share memories and feelings that music brings up.",
    ariaLabel: "Start Memory Connection activity",
  },
];

export default function RhythmRecallHome({ onSelectMode }) {
  const { t } = useI18n();

  useEffect(() => {
    const unregister = registerVoiceContext("rhythm_recall_home", (rawText, parsed) => {
      const text = rawText.toLowerCase();

      if (
        text.includes("recognize") ||
        text.includes("song") ||
        text.includes("play a song") ||
        text.includes("play song") ||
        text.includes("listen") ||
        parsed.intent === "START_SONG" ||
        text.includes("first")
      ) {
        onSelectMode("recognition");
        return { handled: true, speakText: "Sure. Let me play a song for you." };
      }

      if (
        text.includes("memory") ||
        text.includes("connection") ||
        text.includes("feeling") ||
        text.includes("second")
      ) {
        onSelectMode("memory_connection");
        return { handled: true, speakText: "Opening Memory Connection." };
      }

      return false;
    }, MODES); // Pass MODES to registerVoiceContext as options

    return unregister;
  }, [onSelectMode]);

  // ── Voice: Proactive mode announcement on mount ──────────────────────
  const langCode = (t("lang") || "en-IN").split("-")[0].toLowerCase();
  const rhythmAnnouncement = langCode === "hi"
    ? [
        "रिदम और रिकॉल खुल गया है।",
        "यहाँ दो गतिविधियाँ हैं। विकल्प एक है: गाना पहचानें, जहाँ आप सुनकर पहचान सकते हैं।",
        "विकल्प दो है: मेमोरी कनेक्शन, जहाँ आप संगीत के बारे में अपनी भावनाएं साझा कर सकते हैं।",
        "आप कौन सा चाहेंगे?",
      ]
    : langCode === "bn"
    ? [
        "রিদম ও রিকল খুলেছে।",
        "এখানে দুটি কার্যকলাপ রয়েছে। বিকল্প এক হল: গান চিনুন, যেখানে আপনি শুনে চিনতে পারবেন।",
        "বিকল্প দুই হল: মেমরি সংযোগ, যেখানে আপনি সঙ্গীত সম্পর্কে আপনার অনুভূতি শেয়ার করতে পারেন।",
        "আপনি কোনটি চান?",
      ]
    : [
        "Rhythm and Recall is open.",
        "There are two activities. Option one is Recognize the Song, where you listen and identify.",
        "Option two is Memory Connection, where you share your feelings about the music.",
        "Which would you like?",
      ];

  useVoicePageAnnouncer(null, rhythmAnnouncement);

  return (

    <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎵</div>
        <h1
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 900,
            fontSize: "clamp(28px, 5vw, 46px)",
            color: "#1C2F3A",
            letterSpacing: "-1px",
            marginBottom: 12,
          }}
        >
          {t("rrTitle", "Rhythm & Recall")}
        </h1>
        <p
          style={{
            color: "#5C7382",
            fontSize: "clamp(16px, 2.5vw, 20px)",
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          {t("rrSubtitle", "Let's listen to some familiar music.")}
        </p>
      </div>

      {/* Mode cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} onSelect={onSelectMode} t={t} />
        ))}
      </div>

      {/* Footer note */}
      <p
        style={{
          textAlign: "center",
          color: "#5C7382",
          fontSize: 15,
          marginTop: 36,
          lineHeight: 1.6,
          fontWeight: 600,
        }}
      >
        🎵 {t("rrFootnote", "All activities are optional. Go at your own pace.")}
      </p>
    </div>
  );
}

function ModeCard({ mode, onSelect, t }) {
  const btnColor = mode.id === "recognition" ? "#2A8F8A" : "#D946EF";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(28,58,68,0.12)",
        borderRadius: 24,
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 18,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
        boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 16px 36px rgba(28,47,58,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(28,47,58,0.06)";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: `${btnColor}15`,
          border: `2px solid ${btnColor}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 44,
        }}
        aria-hidden="true"
      >
        {mode.icon}
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 900,
          fontSize: "clamp(22px, 3vw, 26px)",
          color: "#1C2F3A",
          margin: 0,
        }}
      >
        {t(mode.titleKey, mode.title)}
      </h2>

      {/* Description */}
      <p
        style={{
          color: "#5C7382",
          fontSize: "clamp(15px, 2vw, 17px)",
          lineHeight: 1.6,
          margin: 0,
          flexGrow: 1,
        }}
      >
        {t(mode.descKey, mode.desc)}
      </p>

      {/* Start button */}
      <button
        onClick={() => onSelect(mode.id)}
        aria-label={mode.ariaLabel}
        style={{
          width: "100%",
          padding: "18px 24px",
          borderRadius: 16,
          background: btnColor,
          border: "none",
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: "clamp(16px, 2.5vw, 20px)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          boxShadow: `0 8px 24px ${btnColor}33`,
          marginTop: 8,
          letterSpacing: 0.3,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
        onFocus={(e) => { e.currentTarget.style.outline = `3px solid ${btnColor}`; e.currentTarget.style.outlineOffset = "3px"; }}
        onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
      >
        {t("rrStart", "START")} {mode.icon}
      </button>
    </div>
  );
}
