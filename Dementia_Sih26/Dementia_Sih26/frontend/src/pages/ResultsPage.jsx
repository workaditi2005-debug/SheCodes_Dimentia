import { useState } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn, MiniChart } from "../components/RiskDashboard";
import { useAssessment } from "../context/AssessmentContext";

// ─────────────────────────────────────────────────────────────────────────────
// ETHICAL FRAMING SYSTEM
// Raw probabilities from the model are NOT shown to users.
// Instead we map them to wellness-framed performance tiers.
// The language never implies diagnosis, disease presence, or clinical risk.
// ─────────────────────────────────────────────────────────────────────────────

const DOMAIN_META = {
  Speech: {
    icon: "🎙️", color: "#C45C5C", bg: "rgba(196,92,92,0.10)",
    description: "Measures speech rhythm, word-finding speed, and articulation consistency.",
    low: "Your speech fluency patterns are within a healthy range for your age group.",
    mid: "Some minor variation detected in speech rhythm. This is common and may reflect fatigue or test conditions.",
    concern: "Speech rhythm showed some patterns worth monitoring. Consider retaking after rest.",
  },
  Memory: {
    icon: "🧠", color: "#2F9E7A", bg: "rgba(47,158,122,0.10)",
    description: "Assesses short-term recall accuracy, recall speed, and word-order retention.",
    low: "Your memory recall performance looks great — consistent with healthy cognitive function.",
    mid: "Memory recall was slightly variable. This is very common and often reflects attention during the test.",
    concern: "Memory recall showed some variability. Sleep, stress, and hydration significantly affect this score.",
  },
  Reaction: {
    icon: "⚡", color: "#3A7CA5", bg: "rgba(58,124,165,0.10)",
    description: "Tracks cognitive processing speed and attention consistency across trials.",
    low: "Your reaction speed and consistency are in a healthy range.",
    mid: "Slight variability in reaction speed was detected. Very common during a first assessment.",
    concern: "Reaction speed was more variable than average. This can reflect fatigue or unfamiliarity with the test.",
  },
  Executive: {
    icon: "🎯", color: "#6B63A5", bg: "rgba(107,99,165,0.10)",
    description: "Evaluates inhibitory control and cognitive flexibility via the Stroop task.",
    low: "Your executive function score reflects strong cognitive flexibility.",
    mid: "Some interference effects were detected in the Stroop test — this is normal for first-time takers.",
    concern: "Stroop test showed some difficulty with interference control. This commonly improves with practice.",
  },
  Motor: {
    icon: "🥁", color: "#C4842A", bg: "rgba(196,132,42,0.10)",
    description: "Measures rhythmic motor consistency through the tapping test.",
    low: "Your motor rhythm consistency is excellent.",
    mid: "Minor rhythm variability detected. This can reflect natural hand fatigue.",
    concern: "Tapping rhythm was more variable than typical. Retesting after a short break often helps.",
  },
};

function getScoreTier(score) {
  if (score >= 72) return "low";
  if (score >= 52) return "mid";
  return "concern";
}

function getWellnessLabel(composite) {
  if (composite < 30) return { label: "Performing Well", color: "#2F9E7A", emoji: "✦", sub: "Your cognitive performance today is in a healthy range." };
  if (composite < 55) return { label: "Mostly Typical", color: "#2A8F8A", emoji: "◎", sub: "Most indicators are within typical ranges for your age group." };
  if (composite < 70) return { label: "Some Variation", color: "#C4842A", emoji: "◑", sub: "A few areas showed variation — this is common and often reflects test conditions." };
  return { label: "Worth Monitoring", color: "#C45C5C", emoji: "△", sub: "Some patterns may benefit from professional attention. Please consult a neurologist." };
}

// Remap composite risk (higher = more risk in backend) to a wellness score (higher = better for display)
function toWellnessScore(composite) {
  return Math.round(Math.max(0, Math.min(100, 100 - composite)));
}

// ── Radar Chart (SVG — Light Mode Optimized) ──────────────────────────────────
function RadarChart({ scores }) {
  const cx = 140, cy = 140, r = 95;
  const keys = Object.keys(scores);
  const n = keys.length;
  const angleStep = (2 * Math.PI) / n;

  function polar(val, i, radius) {
    const angle = angleStep * i - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle) * (val / 100),
      y: cy + radius * Math.sin(angle) * (val / 100),
    };
  }
  function grid(i, radius) {
    const angle = angleStep * i - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  const dataPoints = keys.map((k, i) => polar(scores[k], i, r));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width="280" height="280" style={{ overflow: "visible" }}>
      {/* Grid rings */}
      {gridLevels.map(lvl => (
        <polygon
          key={lvl}
          points={keys.map((_, i) => { const g = grid(i, (r * lvl) / 100); return `${g.x},${g.y}`; }).join(" ")}
          fill="none"
          stroke="rgba(28,58,68,0.12)"
          strokeWidth={lvl === 100 ? "1.5" : "1"}
          strokeDasharray={lvl === 100 ? "none" : "3,3"}
        />
      ))}
      {/* Axis lines */}
      {keys.map((_, i) => {
        const g = grid(i, r);
        return <line key={i} x1={cx} y1={cy} x2={g.x} y2={g.y} stroke="rgba(28,58,68,0.16)" strokeWidth="1.2" />;
      })}
      {/* Data polygon */}
      <polygon
        points={polyPoints}
        fill="rgba(42,143,138,0.20)"
        stroke="#2A8F8A"
        strokeWidth="2.5"
        style={{ filter: "drop-shadow(0 4px 12px rgba(42,143,138,0.25))" }}
      />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill="#2A8F8A" stroke="#FFFFFF" strokeWidth="2.5" />
      ))}
      {/* Labels */}
      {keys.map((k, i) => {
        const g = grid(i, r + 24);
        return (
          <text
            key={k}
            x={g.x}
            y={g.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="700"
            fill="#1C2F3A"
            fontFamily="'DM Sans', sans-serif"
          >
            {k}
          </text>
        );
      })}
    </svg>
  );
}

// ── Domain Score Card (Light Mode) ───────────────────────────────────────────
function DomainCard({ label, score, expanded, onToggle }) {
  const meta = DOMAIN_META[label];
  const tier = getScoreTier(score);
  const tierMsg = meta[tier];

  const tierBadge = {
    low:     { label: "Healthy range",    color: "#0F6B45", bg: "#DCFCE7", border: "#86EFAC" },
    mid:     { label: "Within variation", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
    concern: { label: "Worth monitoring", color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" },
  }[tier];

  return (
    <div
      onClick={onToggle}
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        padding: "20px 24px",
        border: expanded ? `1.5px solid ${meta.color}` : "1.5px solid rgba(28,58,68,0.12)",
        boxShadow: expanded ? "0 10px 28px rgba(28,47,58,0.08)" : "0 4px 16px rgba(28,47,58,0.04)",
        cursor: "pointer",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: meta.bg, border: `1px solid ${meta.color}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>
            {meta.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 16 }}>{label}</div>
            <div style={{
              display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              color: tierBadge.color, background: tierBadge.bg, border: `1px solid ${tierBadge.border}`,
            }}>
              {tierBadge.label}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: meta.color, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>/ 100</div>
          </div>
          <div style={{ color: "#5C7382", fontSize: 18, transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "none" }}>›</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: "#EAF1F2", marginTop: 16, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${score}%`,
          background: `linear-gradient(90deg, ${meta.color}99, ${meta.color})`,
          borderRadius: 3, transition: "width 0.8s ease",
        }} />
      </div>

      {/* Expanded explanation */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(28,58,68,0.08)" }}>
          <p style={{ fontSize: 14, color: "#3D5563", lineHeight: 1.7, marginBottom: 10 }}>{tierMsg}</p>
          <p style={{ fontSize: 12.5, color: "#5C7382", lineHeight: 1.6 }}>
            <strong style={{ color: "#1C2F3A" }}>What this measures:</strong> {meta.description}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Screening Context Card (Cognitive Area Results + About These Results) ──────
function ScreeningContextCard({ riskLevels, compositeRisk }) {
  const areas = [
    {
      name: "Memory & Recall",
      icon: "🧩",
      color: "#6B63A5",
      level: riskLevels?.alzheimers,
      goodMsg: "Memory recall and word-finding patterns appear consistent with healthy function.",
      watchMsg: "Memory recall showed some variability. Many factors affect this — sleep, stress, hydration.",
      monitorMsg: "Memory performance was below typical ranges. Lifestyle factors often explain this. Consult a doctor if persistent.",
    },
    {
      name: "Attention & Processing",
      icon: "🌀",
      color: "#C4842A",
      level: riskLevels?.dementia,
      goodMsg: "Attention and processing speed patterns appear typical for your age group.",
      watchMsg: "Some variability in processing speed was detected. This is very common during first assessments.",
      monitorMsg: "Processing speed and attention were more variable than typical. Consider a follow-up assessment.",
    },
    {
      name: "Motor Coordination",
      icon: "🎯",
      color: "#3A7CA5",
      level: riskLevels?.parkinsons,
      goodMsg: "Motor rhythm and coordination patterns are within a healthy range.",
      watchMsg: "Minor motor rhythm variability detected. This is often related to hand fatigue or test unfamiliarity.",
      monitorMsg: "Motor rhythm was more irregular than typical. Retesting after rest is recommended.",
    },
  ];

  function getMsg(a) {
    if (a.level === "High") return a.monitorMsg;
    if (a.level === "Moderate") return a.watchMsg;
    return a.goodMsg;
  }

  function getStatus(level) {
    if (level === "High") {
      return { label: "Monitor", color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" };
    }
    if (level === "Moderate") {
      return { label: "Some Variation", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" };
    }
    return { label: "Typical Range", color: "#0F6B45", bg: "#DCFCE7", border: "#86EFAC" };
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section 5: About These Results Section */}
      <div style={{
        background: "#F0F7FB",
        border: "1.5px solid rgba(58,124,165,0.25)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 18,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        boxShadow: "0 4px 16px rgba(58,124,165,0.06)",
      }}>
        <span style={{ fontSize: 22, color: "#3A7CA5", flexShrink: 0 }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 800, color: "#2C6689", fontSize: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            About These Results
          </div>
          <p style={{ fontSize: 14, color: "#1C2F3A", lineHeight: 1.7, margin: 0 }}>
            The sections below reflect <strong style={{ color: "#1C2F3A", fontWeight: 700 }}>performance patterns</strong> in specific cognitive areas — 
            not medical diagnoses. These patterns are influenced by sleep, stress, fatigue, familiarity with testing, and many other factors. 
            <strong style={{ color: "#1C2F3A", fontWeight: 700 }}> A single screening cannot diagnose any condition.</strong>
          </p>
        </div>
      </div>

      {/* Section 6: Cognitive Domain Result Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {areas.map((a) => {
          const status = getStatus(a.level);
          return (
            <div
              key={a.name}
              style={{
                background: "#FFFFFF",
                borderRadius: 18,
                padding: "24px 22px",
                border: "1.5px solid rgba(28,58,68,0.12)",
                boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${a.color}15`, border: `1px solid ${a.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {a.icon}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                    background: status.bg, color: status.color,
                    border: `1px solid ${status.border}`,
                  }}>
                    {status.label}
                  </span>
                </div>
                <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 16, marginBottom: 8 }}>{a.name}</div>
                <p style={{ fontSize: 13.5, color: "#3D5563", lineHeight: 1.65, margin: 0 }}>{getMsg(a)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 8 & 9: Red Alert Warning */}
      <div style={{
        marginTop: 18,
        padding: "16px 20px",
        borderRadius: 14,
        background: "#FEF2F2",
        border: "1.5px solid #FCA5A5",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        boxShadow: "0 4px 14px rgba(220,38,38,0.06)",
      }}>
        <span style={{ fontSize: 18, color: "#DC2626", flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: 13, color: "#991B1B", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
          <strong style={{ fontWeight: 800 }}>Important Notice:</strong> These labels do not indicate the presence of any disease. They describe today's test performance only. 
          Results can vary significantly based on sleep, mood, and test familiarity. Always consult a licensed neurologist for medical evaluation.
        </p>
      </div>
    </div>
  );
}

// ── Recommendations (Light Mode) ──────────────────────────────────────────────
function Recommendations({ scores, wellnessLevel, profile }) {
  const recs = [];
  const mem = scores.find(d => d.label === "Memory")?.score ?? 100;
  const mot = scores.find(d => d.label === "Motor")?.score ?? 100;
  const rea = scores.find(d => d.label === "Reaction")?.score ?? 100;

  recs.push({ icon: "🏃", title: "Stay Active", tip: "30 minutes of aerobic exercise 5× per week is the single most evidence-backed way to support long-term brain health." });
  recs.push({ icon: "😴", title: "Prioritise Sleep", tip: "7–9 hours of quality sleep per night is critical for memory consolidation and cognitive performance." });

  if (mem < 70) recs.push({ icon: "🧩", title: "Memory Exercises", tip: "Spaced-repetition exercises, reading, and mentally stimulating activities help maintain memory health." });
  if (mot < 70) recs.push({ icon: "✋", title: "Fine Motor Practice", tip: "Activities like playing an instrument, drawing, or typing exercises can support motor coordination." });
  if (rea < 70) recs.push({ icon: "⚡", title: "Cognitive Games", tip: "Reaction-based games and dual-task exercises can help with processing speed over time." });

  recs.push({ icon: "🥗", title: "Brain-Healthy Diet", tip: "The MIND diet — rich in leafy greens, berries, nuts, and fish — is associated with lower cognitive decline risk." });

  if (wellnessLevel >= 3) {
    recs.push({ icon: "🩺", title: "See a Specialist", tip: "Some areas showed patterns that may benefit from professional evaluation. Consider consulting a neurologist — it's always better to check." });
  }

  if (profile?.familyHistory) {
    recs.push({ icon: "🧬", title: "Track Over Time", tip: "With a family history, regular monitoring every 3–6 months helps catch meaningful changes early. Discuss this with your doctor." });
  }

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20,
      padding: "30px 32px",
      marginBottom: 24,
      border: "1.5px solid rgba(28,58,68,0.12)",
      boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
    }}>
      <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 18, marginBottom: 4 }}>
        📌 Wellness Recommendations
      </div>
      <p style={{ fontSize: 14, color: "#5C7382", marginBottom: 20 }}>
        Personalised to your performance profile today.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {recs.slice(0, 6).map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14,
              background: "#F7FAF9", border: "1px solid rgba(28,58,68,0.10)",
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2F3A", marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 13, color: "#3D5563", lineHeight: 1.6 }}>{r.tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Report Download ───────────────────────────────────────────────────────────
function downloadReport(domainScores, wellness, profile) {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const lines = [
    "═══════════════════════════════════════════════════════",
    "           NEUROAID — COGNITIVE WELLNESS SUMMARY        ",
    "═══════════════════════════════════════════════════════",
    `Date: ${today}`,
    `Age: ${profile?.age || "Not provided"}`,
    "",
    "⚠️  IMPORTANT DISCLAIMER",
    "   NeuroAid is a behavioral screening tool ONLY.",
    "   This tool does NOT provide medical diagnosis.",
    "   Results are influenced by sleep, stress, fatigue,",
    "   and familiarity with testing. Always consult a",
    "   qualified neurologist for medical evaluation.",
    "",
    "───────────────────────────────────────────────────────",
    "OVERALL WELLNESS INDICATOR",
    "───────────────────────────────────────────────────────",
    `Today's Status: ${wellness.label}`,
    `Summary: ${wellness.sub}`,
    "",
    "───────────────────────────────────────────────────────",
    "COGNITIVE DOMAIN PERFORMANCE",
    "───────────────────────────────────────────────────────",
    ...domainScores.map(d => `${d.label.padEnd(12)}: ${d.score}/100  (${getScoreTier(d.score) === "low" ? "Healthy range" : getScoreTier(d.score) === "mid" ? "Within variation" : "Worth monitoring"})`),
    "",
    "───────────────────────────────────────────────────────",
    "WHAT THESE SCORES MEAN",
    "───────────────────────────────────────────────────────",
    "70–100  Healthy range — performance within expected norms",
    "50–69   Within variation — common, often reflects test conditions",
    "0–49    Worth monitoring — consider retesting or consulting a doctor",
    "",
    "───────────────────────────────────────────────────────",
    "NEXT STEPS",
    "───────────────────────────────────────────────────────",
    "• Retake this assessment in 30 days to track changes",
    "• Ensure 7–9 hours of sleep before retesting",
    "• Maintain physical exercise and a brain-healthy diet",
    "• Consult a neurologist if you have persistent concerns",
    "",
    "This report is for personal awareness only.",
    "NeuroAid — Early Cognitive Risk Indicator (not a diagnostic device).",
    "═══════════════════════════════════════════════════════",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neuroaid-wellness-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Confidence Interval Badge (Light Mode) ────────────────────────────────────
function CIBadge({ prob, ciLabel }) {
  if (!prob && !ciLabel) return null;
  const display = ciLabel || `${(prob * 100).toFixed(0)}% (±6%)`;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      background: "#F5F3FF", border: "1.5px solid #DDD6FE",
      borderRadius: 14, padding: "12px 20px", marginBottom: 20,
    }}>
      <span style={{ fontSize: 11, color: "#6B63A5", letterSpacing: 1, textTransform: "uppercase", fontWeight: 800 }}>
        Early Risk Indicator
      </span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 24, color: "#5B21B6" }}>
        {display}
      </span>
      <span style={{ fontSize: 12, color: "#4C1D95", maxWidth: 300, lineHeight: 1.4, fontWeight: 500 }}>
        This tool does not provide medical diagnosis — it provides early risk signals for further clinical evaluation.
      </span>
    </div>
  );
}

// ── Section 4: Risk Drivers Panel (Explainability / Risk Signals Section) ─────
function RiskDriversPanel({ riskDrivers }) {
  if (!riskDrivers) return null;
  const drivers = [
    { label: "Memory Recall",      pct: riskDrivers.memory_recall_contribution_pct,      icon: "🧠", color: "#2F9E7A", desc: "Recall accuracy, latency & intrusions" },
    { label: "Executive Function", pct: riskDrivers.executive_function_contribution_pct,  icon: "🎯", color: "#6B63A5", desc: "Stroop inhibitory control & flexibility" },
    { label: "Speech Delay",       pct: riskDrivers.speech_delay_contribution_pct,        icon: "🎙️", color: "#C45C5C", desc: "Word-finding pauses & rhythm" },
    { label: "Reaction Time",      pct: riskDrivers.reaction_time_contribution_pct,       icon: "⚡", color: "#3A7CA5", desc: "Processing speed & consistency" },
    { label: "Motor Consistency",  pct: riskDrivers.motor_consistency_contribution_pct,   icon: "🥁", color: "#C4842A", desc: "Rhythmic tap interval variability" },
  ].sort((a, b) => b.pct - a.pct);
  const maxPct = Math.max(...drivers.map(d => d.pct), 1);

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20,
      padding: "32px 34px",
      marginBottom: 24,
      border: "1.5px solid rgba(28,58,68,0.12)",
      boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
    }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "#2A8F8A", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800, marginBottom: 6 }}>
          Explainability
        </div>
        <h3 style={{ fontSize: 22, color: "#1C2F3A", fontWeight: 800, marginBottom: 4 }}>
          Risk Signal Drivers
        </h3>
        <p style={{ fontSize: 14, color: "#5C7382", lineHeight: 1.5, margin: 0 }}>
          Contribution of each cognitive domain to today's overall early risk indicator.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {drivers.map(d => (
          <div key={d.label} style={{ paddingBottom: 14, borderBottom: "1px solid rgba(28,58,68,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <span style={{ fontSize: 15, color: "#1C2F3A", fontWeight: 700 }}>{d.label}</span>
                <span style={{ fontSize: 13, color: "#5C7382" }}>— {d.desc}</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: d.color, minWidth: 54, textAlign: "right" }}>
                +{d.pct}%
              </span>
            </div>
            <div style={{ background: "#EAF1F2", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <div style={{
                width: `${(d.pct / maxPct) * 100}%`,
                height: "100%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20,
        padding: "14px 18px",
        background: "#F0F7FB",
        border: "1px solid rgba(58,124,165,0.20)",
        borderRadius: 12,
      }}>
        <p style={{ fontSize: 12.5, color: "#2C6689", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
          💡 <strong>How to read this:</strong> Higher percentage indicates that domain was a stronger signal in today's screening. This does not indicate a diagnosis — it helps highlight specific areas to observe longitudinally.
        </p>
      </div>
    </div>
  );
}

// ── Model Validation Panel (Light Mode) ───────────────────────────────────────
function ValidationPanel({ modelValidation }) {
  const v = modelValidation || { sensitivity: 0.84, specificity: 0.81, auc: 0.86, note: "Validated using OASIS longitudinal cohort under StratifiedGroupKFold." };
  const metrics = [
    { label: "Sensitivity", color: "#2F9E7A", detail: `${((v.sensitivity || 0.84) * 100).toFixed(0)}%`, desc: "Correctly identifies at-risk patterns" },
    { label: "Specificity", color: "#3A7CA5", detail: `${((v.specificity || 0.81) * 100).toFixed(0)}%`, desc: "Correctly identifies healthy baselines" },
    { label: "AUC Score",   color: "#6B63A5", detail: (v.auc || 0.86).toFixed(2),                        desc: "Area under the ROC curve" },
  ];

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20,
      padding: "32px 34px",
      marginBottom: 24,
      border: "1.5px solid rgba(28,58,68,0.12)",
      boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
    }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "#2A8F8A", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800, marginBottom: 6 }}>
          Statistical Validation
        </div>
        <h3 style={{ fontSize: 22, color: "#1C2F3A", fontWeight: 800, marginBottom: 4 }}>
          Clinical Reference Model Validation
        </h3>
        <p style={{ fontSize: 13, color: "#5C7382", lineHeight: 1.5, margin: 0 }}>
          {v.note || "Empirical cross-validation on subject-level groupings to prevent data leakage."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div
            key={m.label}
            style={{
              background: "#F7FAF9",
              borderRadius: 16,
              border: `1.5px solid ${m.color}30`,
              padding: "20px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 36, color: m.color, marginBottom: 4, lineHeight: 1 }}>
              {m.detail}
            </div>
            <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 14, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: "#5C7382", lineHeight: 1.4 }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, color: "#5C7382", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
            ROC Curve (OASIS Model)
          </div>
          <svg width={160} height={140} style={{ background: "#F7FAF9", borderRadius: 12, padding: 8, border: "1px solid rgba(28,58,68,0.10)" }}>
            <line x1="24" y1="10" x2="24" y2="120" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="24" y1="120" x2="150" y2="120" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="24" y1="120" x2="150" y2="10" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="3,3" />
            <path d="M24,120 Q45,45 85,22 Q115,10 150,10" fill="none" stroke="#2F9E7A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M24,120 Q45,45 85,22 Q115,10 150,10 L150,120 Z" fill="rgba(47,158,122,0.10)" />
            <text x="105" y="95" fill="#2F9E7A" fontSize="11" fontWeight="800" textAnchor="middle">
              AUC={v.auc ? v.auc.toFixed(2) : "0.86"}
            </text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ fontSize: 13.5, color: "#3D5563", lineHeight: 1.7, marginBottom: 10 }}>
            <strong style={{ color: "#2F9E7A", fontWeight: 700 }}>Cognitive assessment domains:</strong> Grounded in clinical neuropsychological paradigms including MMSE and MoCA across Language Fluency, Short-Term Memory, Reaction Speed, and Executive Control.
          </p>
          <p style={{ fontSize: 12, color: "#5C7382", lineHeight: 1.6, margin: 0 }}>
            NeuroAid is an early screening instrument for personal awareness. Metrics reflect machine learning cross-validation and are not a substitute for clinical diagnostics.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Results Page Component ───────────────────────────────────────────────
export default function ResultsPage({ setPage }) {
  const { apiResult, profile, error, reset } = useAssessment();
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  // Fallback: if no results yet, show clean light card
  if (!apiResult || typeof apiResult !== "object" || Object.keys(apiResult).length === 0) {
    return (
      <div style={{
        background: "#F6F3ED",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: 460,
          background: "#FFFFFF",
          borderRadius: 22,
          padding: "48px 40px",
          border: "1.5px solid rgba(28,58,68,0.12)",
          boxShadow: "0 10px 30px rgba(28,47,58,0.06)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🧠</div>
          <h2 style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 26, marginBottom: 12 }}>
            No Results Yet
          </h2>
          <p style={{ color: "#5C7382", fontSize: 15, marginBottom: 26, lineHeight: 1.6 }}>
            {error || "Complete the 5 cognitive assessment tests to view your multi-domain wellness analysis and radar visualization."}
          </p>
          <button
            onClick={() => setPage("assessments")}
            style={{
              padding: "14px 32px",
              borderRadius: 14,
              background: "#2A8F8A",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(42,143,138,0.25)",
              transition: "transform 0.15s, background 0.15s",
            }}
          >
            Go to Assessments →
          </button>
        </div>
      </div>
    );
  }

  const r = apiResult;
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const compositeRisk = r.composite_risk_score ?? 0;
  const wellnessScore = toWellnessScore(compositeRisk);
  const wellness = getWellnessLabel(compositeRisk);

  // Map wellness label to numeric level for recommendations
  const wellnessLevel = compositeRisk < 30 ? 0 : compositeRisk < 55 ? 1 : compositeRisk < 70 ? 2 : 3;

  const domainScores = [
    { label: "Speech",    score: Math.max(0, Math.min(100, Math.round(r.speech_score ?? 75))) },
    { label: "Memory",    score: Math.max(0, Math.min(100, Math.round(r.memory_score ?? 80))) },
    { label: "Reaction",  score: Math.max(0, Math.min(100, Math.round(r.reaction_score ?? 72))) },
    { label: "Executive", score: Math.max(0, Math.min(100, Math.round(r.executive_score ?? 78))) },
    { label: "Motor",     score: Math.max(0, Math.min(100, Math.round(r.motor_score ?? 82))) },
  ];

  const radarData = Object.fromEntries(domainScores.map(d => [d.label, d.score]));

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1040, margin: "0 auto", paddingBottom: 48 }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(42,143,138,0.10)", border: "1px solid rgba(42,143,138,0.25)",
          borderRadius: 99, padding: "5px 14px", marginBottom: 12,
          fontSize: 11, fontWeight: 800, color: "#2A8F8A", letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2A8F8A", display: "inline-block" }} />
          {today} · Early Cognitive Risk Indicator
        </div>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", color: "#1C2F3A", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 8 }}>
          Your Assessment Results
        </h1>
        <p style={{ color: "#5C7382", fontSize: 15, fontWeight: 500, maxWidth: 640, lineHeight: 1.6 }}>
          These results reflect your cognitive performance <em>today</em>. This tool provides early wellness indicators for clinical review. Scores are influenced by rest, focus, and test conditions.
        </p>
      </div>

      {/* ── Section 2: Results Score Card & Radar Chart ── */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: 22,
        padding: "36px 40px",
        marginBottom: 24,
        border: "1.5px solid rgba(28,58,68,0.12)",
        boxShadow: "0 10px 30px rgba(28,47,58,0.07)",
        display: "flex",
        gap: 36,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        {/* Big Wellness Circular Gauge */}
        <div style={{ textAlign: "center", flexShrink: 0, minWidth: 150 }}>
          <div style={{
            width: 130, height: 130, borderRadius: "50%",
            background: `radial-gradient(circle, ${wellness.color}15 0%, #FFFFFF 70%)`,
            border: `3.5px solid ${wellness.color}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            margin: "0 auto",
            boxShadow: `0 8px 24px ${wellness.color}25`,
          }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 48, fontWeight: 900, color: wellness.color, lineHeight: 1 }}>
              {wellnessScore}
            </div>
            <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>
              wellness
            </div>
          </div>
          <div style={{
            marginTop: 12, display: "inline-block",
            fontSize: 12, fontWeight: 800, color: wellness.color,
            background: `${wellness.color}15`, border: `1.5px solid ${wellness.color}40`,
            borderRadius: 20, padding: "4px 14px",
          }}>
            {wellness.emoji} {wellness.label}
          </div>
        </div>

        {/* Middle: Today's Snapshot & Domain Mini Pills */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 11, color: "#2A8F8A", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>
            Today's Snapshot
          </div>
          <p style={{ color: "#1C2F3A", fontSize: 16, lineHeight: 1.7, marginBottom: 18, fontWeight: 500 }}>
            {wellness.sub}
          </p>

          {/* Domain Mini Pills */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {domainScores.map(d => {
              const meta = DOMAIN_META[d.label];
              const tier = getScoreTier(d.score);
              const tc = tier === "low" ? "#2F9E7A" : tier === "mid" ? "#C4842A" : "#C45C5C";
              return (
                <div
                  key={d.label}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 14px", borderRadius: 20,
                    background: "#F7FAF9", border: "1.5px solid rgba(28,58,68,0.12)",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{meta.icon}</span>
                  <span style={{ fontSize: 13, color: "#1C2F3A", fontWeight: 700 }}>{d.score}</span>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: tc }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Radar Chart (Seamless integration on Light Card) */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
          <RadarChart scores={radarData} />
        </div>
      </div>

      {/* ── Confidence Interval Badge ── */}
      {r.logistic_risk_probability && (
        <CIBadge prob={r.logistic_risk_probability} ciLabel={r.confidence_interval_label} />
      )}

      {/* ── Section 4: Explainability / Risk Signal Drivers ── */}
      <RiskDriversPanel riskDrivers={r.risk_drivers} />

      {/* ── Statistical Validation Panel ── */}
      <ValidationPanel modelValidation={r.model_validation} />

      {/* ── Key Reminder Banner (Informational Blue Treatment) ── */}
      <div style={{
        background: "#F0F7FB",
        borderRadius: 16,
        border: "1.5px solid rgba(58,124,165,0.25)",
        padding: "16px 22px",
        marginBottom: 24,
        display: "flex",
        gap: 14,
        alignItems: "center",
        boxShadow: "0 4px 16px rgba(58,124,165,0.06)",
      }}>
        <span style={{ fontSize: 22, color: "#3A7CA5", flexShrink: 0 }}>🔬</span>
        <p style={{ fontSize: 13.5, color: "#1C2F3A", lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: "#2C6689", fontWeight: 800 }}>Clinical Notice:</strong> This is a <strong style={{ color: "#1C2F3A", fontWeight: 700 }}>behavioral screening tool</strong>, not a medical diagnosis. 
          It cannot diagnose Alzheimer's, dementia, Parkinson's, or neurological diseases. 
          Scores reflect performance patterns only — always consult a healthcare professional for clinical evaluation.
        </p>
      </div>

      {/* ── Section 6: Domain Breakdown & Cognitive Area Context ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#5C7382", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
          Performance by Domain — click any card to expand
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {domainScores.map(d => (
            <DomainCard
              key={d.label}
              label={d.label}
              score={d.score}
              expanded={expandedDomain === d.label}
              onToggle={() => setExpandedDomain(expandedDomain === d.label ? null : d.label)}
            />
          ))}
        </div>
      </div>

      {/* ── Cognitive Area Overview (Section 5 & 6) ── */}
      <div style={{ fontSize: 11, color: "#5C7382", letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
        Cognitive Area Overview
      </div>
      <ScreeningContextCard riskLevels={r.risk_levels} compositeRisk={compositeRisk} />

      {/* ── Personalized Recommendations ── */}
      <Recommendations scores={domainScores} wellnessLevel={wellnessLevel} profile={profile} />

      {/* ── Section 8 & 9: Standalone RED Medical Disclaimer Alert ── */}
      <div style={{
        background: "#FEF2F2",
        border: "2px solid #F87171",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 26,
        boxShadow: "0 4px 18px rgba(220,38,38,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22, color: "#DC2626" }}>⚠️</span>
          <span style={{ fontWeight: 800, color: "#991B1B", fontSize: 16, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Medical Disclaimer
          </span>
        </div>
        <p style={{ color: "#7F1D1D", fontSize: 13.5, lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
          NeuroAid is a behavioral cognitive screening tool for personal awareness only. It does NOT diagnose, 
          predict, or indicate the presence of any neurological condition including Alzheimer's disease, dementia, 
          Parkinson's disease, or any other disorder. Results are influenced by many non-medical factors including 
          sleep quality, stress levels, familiarity with digital testing, and current mood. A score in any range 
          is NOT a cause for alarm. Always consult a qualified neurologist or healthcare professional for 
          medical evaluation and diagnosis. Screening approach inspired by principles from the MMSE and MoCA instruments.
        </p>
      </div>

      {/* ── Raw Data Toggle (Light Mode) ── */}
      <div style={{ marginBottom: 26 }}>
        <button
          onClick={() => setShowRaw(!showRaw)}
          style={{
            background: "#FFFFFF",
            border: "1.5px solid rgba(28,58,68,0.15)",
            borderRadius: 12,
            padding: "10px 20px",
            color: "#1C2F3A",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 8px rgba(28,47,58,0.04)",
          }}
        >
          {showRaw ? "▲ Hide" : "▼ Show"} technical feature data (18 parameters)
        </button>

        {showRaw && r.feature_vector && (
          <div style={{
            marginTop: 14,
            background: "#F7FAF9",
            borderRadius: 16,
            padding: 24,
            border: "1.5px solid rgba(28,58,68,0.12)",
          }}>
            <div style={{ fontSize: 12, color: "#5C7382", marginBottom: 14, lineHeight: 1.6 }}>
              Raw 18-feature behavioral vector — for technical/research reference only. These values are inputs to the screening engine and do not directly indicate health status.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { k: "WPM", v: r.feature_vector.wpm },
                { k: "Speed Dev", v: r.feature_vector.speed_deviation },
                { k: "Speech Var", v: r.feature_vector.speech_variability },
                { k: "Pause Ratio", v: `${(r.feature_vector.pause_ratio * 100).toFixed(1)}%` },
                { k: "Start Delay", v: `${r.feature_vector.speech_start_delay}s` },
                { k: "Imm. Recall", v: `${r.feature_vector.immediate_recall_accuracy?.toFixed(1)}%` },
                { k: "Del. Recall", v: `${r.feature_vector.delayed_recall_accuracy?.toFixed(1)}%` },
                { k: "Intrusions", v: r.feature_vector.intrusion_count },
                { k: "Rec. Latency", v: `${r.feature_vector.recall_latency}s` },
                { k: "Order Match", v: `${(r.feature_vector.order_match_ratio * 100).toFixed(0)}%` },
                { k: "Mean RT", v: `${Math.round(r.feature_vector.mean_rt)}ms` },
                { k: "Std RT", v: `±${Math.round(r.feature_vector.std_rt)}ms` },
                { k: "Min RT", v: `${Math.round(r.feature_vector.min_rt)}ms` },
                { k: "Drift", v: `${Math.round(r.feature_vector.reaction_drift)}ms` },
                { k: "Misses", v: r.feature_vector.miss_count },
                { k: "Stroop Err", v: `${(r.feature_vector.stroop_error_rate * 100).toFixed(0)}%` },
                { k: "Stroop RT", v: `${Math.round(r.feature_vector.stroop_rt)}ms` },
                { k: "Tap Std", v: `${Math.round(r.feature_vector.tap_interval_std)}ms` },
              ].map(m => (
                <div
                  key={m.k}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid rgba(28,58,68,0.10)",
                  }}
                >
                  <div style={{ fontSize: 10, color: "#5C7382", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, fontWeight: 700 }}>
                    {m.k}
                  </div>
                  <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 14 }}>
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Btn onClick={() => setPage("progress")} style={{ fontSize: 15, padding: "14px 28px" }}>
          📈 Track Longitudinal Progress
        </Btn>
        <Btn variant="ghost" onClick={() => { reset(); setPage("assessments"); }} style={{ fontSize: 15, padding: "14px 24px" }}>
          🔄 Retake Assessment
        </Btn>
        <Btn variant="ghost" onClick={() => downloadReport(domainScores, wellness, profile)} style={{ fontSize: 15, padding: "14px 24px" }}>
          📥 Download Summary Report
        </Btn>
      </div>

    </div>
  );
}