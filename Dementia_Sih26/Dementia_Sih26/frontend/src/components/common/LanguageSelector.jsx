import { useI18n } from "../../i18n/LanguageContext";
import { messages } from "../../i18n/locales";

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 14, opacity: 0.8 }} title="Select Language">🌐</span>
      <select
        aria-label="Language Selector"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: "#FFFFFF",
          color: "#1C2F3A",
          border: "1.5px solid rgba(42, 143, 138, 0.35)",
          borderRadius: 12,
          padding: "8px 14px",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
          outline: "none",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.40)",
          transition: "all 0.2s ease",
        }}
      >
        {Object.keys(messages).map((code) => (
          <option
            key={code}
            value={code}
            style={{
              background: "#FFFFFF",
              color: code === "as-IN" ? "#2A8F8A" : "#1C2F3A",
              padding: 8,
              fontWeight: code === "as-IN" ? "bold" : "normal",
            }}
          >
            {messages[code].language}
          </option>
        ))}
      </select>
    </div>
  );
}
