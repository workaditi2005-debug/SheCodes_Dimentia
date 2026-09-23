import { T } from "../utils/theme";
import { DarkCard, Btn, Badge, MiniChart } from "../components/RiskDashboard";

// Static demo results page (for demo/presentation purposes).
// Uses warm healthcare light mode consistent with ResultsPage.jsx.

const SCORES = [
  { label: "Speech Analysis", score: 74, icon: "🎙️", color: "#C45C5C" },
  { label: "Memory Recall",   score: 82, icon: "🧠", color: "#2F9E7A" },
  { label: "Reaction Time",   score: 68, icon: "⚡", color: "#3A7CA5" },
];

export default function Results({ setPage }) {
  const overall = Math.round(SCORES.reduce((s, x) => s + x.score, 0) / SCORES.length);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1000, margin: "0 auto", paddingBottom: 48 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(42,143,138,0.10)", border: "1px solid rgba(42,143,138,0.25)",
          borderRadius: 99, padding: "5px 14px", marginBottom: 12,
          fontSize: 11, fontWeight: 800, color: "#2A8F8A", letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          Demo Assessment Results
        </div>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 4vw, 40px)", color: "#1C2F3A", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 6 }}>
          Assessment Results
        </h1>
        <p style={{ color: "#5C7382", fontSize: 15 }}>Standard baseline screening · Three core cognitive domains assessed</p>
      </div>

      {/* Overall score card */}
      <DarkCard
        style={{
          padding: "36px 40px",
          marginBottom: 24,
          background: "#FFFFFF",
          border: "1.5px solid rgba(28,58,68,0.12)",
          boxShadow: "0 10px 30px rgba(28,47,58,0.06)",
        }}
        hover={false}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "#2A8F8A", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 800, marginBottom: 10 }}>
              Overall Cognitive Score
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 84, color: "#1C2F3A", lineHeight: 1 }}>
                {overall}
              </span>
              <span style={{ color: "#5C7382", fontSize: 24, fontWeight: 600, paddingBottom: 14 }}>/ 100</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 20,
                background: "#DCFCE7", color: "#0F6B45", border: "1px solid #86EFAC",
              }}>
                ● Healthy Range
              </span>
            </div>
          </div>
          <div style={{ background: "#F7FAF9", borderRadius: 16, padding: "16px 20px", border: "1px solid rgba(28,58,68,0.10)" }}>
            <MiniChart data={[58, 61, 64, 60, 67, 70, overall]} color="#2A8F8A" height={90} />
          </div>
        </div>
      </DarkCard>

      {/* Domain cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        {SCORES.map((s) => (
          <DarkCard
            key={s.label}
            style={{
              padding: "24px 22px",
              textAlign: "center",
              background: "#FFFFFF",
              border: "1.5px solid rgba(28,58,68,0.12)",
              boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
            }}
          >
            <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}15`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1C2F3A", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 44, color: s.color, lineHeight: 1, marginBottom: 12 }}>
              {s.score}
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#EAF1F2", marginBottom: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${s.score}%`, background: s.color, borderRadius: 3 }} />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
              background: s.score >= 75 ? "#DCFCE7" : s.score >= 55 ? "#FEF3C7" : "#FEE2E2",
              color: s.score >= 75 ? "#0F6B45" : s.score >= 55 ? "#92400E" : "#991B1B",
              border: `1px solid ${s.score >= 75 ? "#86EFAC" : s.score >= 55 ? "#FDE68A" : "#FCA5A5"}`,
            }}>
              {s.score >= 75 ? "Healthy" : s.score >= 55 ? "Typical" : "Monitor"}
            </span>
          </DarkCard>
        ))}
      </div>

      {/* Clinical interpretation card */}
      <DarkCard
        style={{
          padding: "28px 32px",
          marginBottom: 24,
          background: "#FFFFFF",
          border: "1.5px solid rgba(28,58,68,0.12)",
          boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
        }}
        hover={false}
      >
        <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 18, marginBottom: 10 }}>
          Clinical Interpretation
        </div>
        <p style={{ color: "#3D5563", lineHeight: 1.8, fontSize: 14.5, margin: 0 }}>
          Your overall score of <strong style={{ color: "#1C2F3A" }}>{overall}/100</strong> places you in the{" "}
          <strong style={{ color: "#0F6B45" }}>Healthy Performance</strong> category.
          Speech patterns show normal fluency. Memory recall is strong at 82%. Reaction time is within typical normative ranges.
          <strong style={{ color: "#1C2F3A" }}> Continue periodic assessments</strong> to monitor ongoing longitudinal trends.
        </p>
      </DarkCard>

      {/* Section 8 & 9: Red Medical Disclaimer */}
      <div style={{
        background: "#FEF2F2",
        border: "2px solid #F87171",
        borderRadius: 16,
        padding: "22px 26px",
        marginBottom: 24,
        boxShadow: "0 4px 18px rgba(220,38,38,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 20, color: "#DC2626" }}>⚠️</span>
          <span style={{ fontWeight: 800, color: "#991B1B", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Medical Disclaimer
          </span>
        </div>
        <p style={{ color: "#7F1D1D", fontSize: 13, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
          NeuroAid provides cognitive screening insights and does not diagnose medical conditions. Results should be discussed with a qualified healthcare professional.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Btn onClick={() => setPage?.("progress")} style={{ fontSize: 15, padding: "13px 26px" }}>
          📈 View Progress History
        </Btn>
        <Btn variant="ghost" onClick={() => setPage?.("assessments")} style={{ fontSize: 15, padding: "13px 22px" }}>
          🔄 Retake Assessments
        </Btn>
      </div>
    </div>
  );
}
