import { useEffect, useState } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn, Badge } from "../components/RiskDashboard";
import { getMyResults } from "../services/api";

const LIME = "#2A8F8A";
const RED  = "#C45C5C";
const AMB  = "#C4842A";
const BLU  = "#3A7CA5";
const PUR  = "#6B63A5";
const GRN  = "#2F9E7A";

// ─────────────────────────────────────────────────────────────────────────────
// Progress Page — Longitudinal Cognitive Tracking (Light Mode)
// ─────────────────────────────────────────────────────────────────────────────

function riskToWellness(compositeRisk) {
  return Math.round(Math.max(0, Math.min(100, 100 - (compositeRisk ?? 50))));
}

function domainScore(val) {
  return Math.round(Math.max(0, Math.min(100, val ?? 0)));
}

function entryOverall(h) {
  if (h.composite_risk_score != null) {
    return riskToWellness(h.composite_risk_score);
  }
  const vals = [h.speech_score, h.memory_score, h.reaction_score, h.executive_score, h.motor_score]
    .filter(v => v != null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

function scoreTier(s) {
  if (s >= 70) return { label: "Healthy", color: "#0F6B45", bg: "#DCFCE7", border: "#86EFAC" };
  if (s >= 50) return { label: "Typical", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" };
  return              { label: "Monitor", color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5" };
}

// ── Sparkline (Light Mode Optimized) ──────────────────────────────────────────
function Sparkline({ data, color = LIME, height = 70, width = "100%" }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7FAF9", borderRadius: 12, border: "1px dashed rgba(28,58,68,0.15)" }}>
        <span style={{ fontSize: 13, color: "#5C7382", fontWeight: 600 }}>Complete 2+ sessions to visualize trajectory</span>
      </div>
    );
  }

  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const viewBoxWidth = 500;
  const viewBoxHeight = height;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * viewBoxWidth;
    const y = viewBoxHeight - ((v - min) / range) * (viewBoxHeight - 16) - 8;
    return `${x},${y}`;
  }).join(" ");

  // Gradient area beneath
  const firstPoint = `0,${viewBoxHeight}`;
  const lastPoint = `${viewBoxWidth},${viewBoxHeight}`;
  const areaPoints = `${firstPoint} ${pts} ${lastPoint}`;

  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} style={{ width: "100%", height, overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * viewBoxWidth;
        const y = viewBoxHeight - ((v - min) / range) * (viewBoxHeight - 16) - 8;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={isLast ? 6 : 3.5}
              fill={isLast ? color : "#FFFFFF"}
              stroke={color}
              strokeWidth={isLast ? 3 : 2}
            />
            {isLast && (
              <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TrendBadge({ data }) {
  if (!data || data.length < 2) {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: "#5C7382", padding: "4px 12px", borderRadius: 20, background: "rgba(28,58,68,0.06)", border: "1px solid rgba(28,58,68,0.12)" }}>
        Baseline Session
      </span>
    );
  }
  const diff  = data[data.length - 1] - data[0];
  const isPos = diff > 2;
  const isNeg = diff < -2;
  const color = isPos ? "#0F6B45" : isNeg ? "#991B1B" : "#92400E";
  const bg    = isPos ? "#DCFCE7" : isNeg ? "#FEE2E2" : "#FEF3C7";
  const border= isPos ? "#86EFAC" : isNeg ? "#FCA5A5" : "#FDE68A";
  const arrow = isPos ? "↑" : isNeg ? "↓" : "→";
  const label = isPos ? `+${Math.round(diff)} pts` : isNeg ? `${Math.round(diff)} pts` : "Stable";
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, padding: "4px 12px", borderRadius: 20, background: bg, border: `1px solid ${border}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span>{arrow}</span>
      <span>{label}</span>
    </span>
  );
}

function DomainTrack({ label, icon, data, labels, color }) {
  const latest = data.length ? data[data.length - 1] : null;
  const tier   = scoreTier(latest ?? 0);
  const avg    = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 18,
      padding: "22px 20px",
      border: "1.5px solid rgba(28,58,68,0.12)",
      boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 16 }}>{label}</div>
            <div style={{
              display: "inline-block", marginTop: 2, padding: "2px 8px", borderRadius: 10,
              fontSize: 11, fontWeight: 700,
              color: tier.color, background: tier.bg, border: `1px solid ${tier.border}`,
            }}>
              {tier.label}
            </div>
          </div>
        </div>
        <TrendBadge data={data} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#5C7382", marginBottom: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Score</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 34, color: latest != null ? "#1C2F3A" : "#5C7382", lineHeight: 1 }}>
            {latest != null ? latest : "—"}
            <span style={{ fontSize: 14, color: "#5C7382", fontWeight: 500, marginLeft: 3 }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#5C7382", marginBottom: 2, fontWeight: 700, textTransform: "uppercase" }}>Session Avg</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: color }}>{data.length ? avg : "—"}</div>
        </div>
      </div>

      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <Sparkline data={data} color={color} height={50} />
      </div>

      {labels.length > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, borderTop: "1px solid rgba(28,58,68,0.08)", paddingTop: 6 }}>
          <span style={{ fontSize: 11, color: "#5C7382", fontWeight: 600 }}>{labels[0]}</span>
          <span style={{ fontSize: 11, color: "#5C7382", fontWeight: 600 }}>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

function HistoryTable({ history }) {
  if (!history.length) return null;
  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20,
      padding: "28px 30px",
      marginTop: 24,
      border: "1.5px solid rgba(28,58,68,0.12)",
      boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 18, margin: 0 }}>Assessment History Log</h3>
          <p style={{ fontSize: 13, color: "#5C7382", marginTop: 4, margin: 0 }}>Recorded past assessments and multi-domain breakdown</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: LIME, background: `${LIME}14`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${LIME}30` }}>
          {history.length} Session{history.length > 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(28,58,68,0.12)" }}>
              {["Date", "Overall Wellness", "Speech", "Memory", "Reaction", "Executive", "Motor"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", fontSize: 11, color: "#5C7382", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 800 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((a, i) => {
              const overall     = entryOverall(a);
              const overallTier = scoreTier(overall);
              const rawDate = a.createdAt || a.timestamp;
              const date    = rawDate
                ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—";

              const domains = [
                { score: a.speech_score, color: RED },
                { score: a.memory_score, color: BLU },
                { score: a.reaction_score, color: AMB },
                { score: a.executive_score, color: PUR },
                { score: a.motor_score, color: LIME },
              ];

              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(28,58,68,0.08)", transition: "background 0.15s" }}>
                  <td style={{ padding: "14px 14px", color: "#1C2F3A", fontWeight: 700, fontSize: 13 }}>{date}</td>
                  <td style={{ padding: "14px 14px" }}>
                    <span style={{ fontWeight: 900, color: overallTier.color, fontSize: 16 }}>{overall}</span>
                    <span style={{ fontSize: 11, color: "#5C7382", marginLeft: 4 }}>/100</span>
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: overallTier.bg, color: overallTier.color, border: `1px solid ${overallTier.border}` }}>
                      {overallTier.label}
                    </span>
                  </td>
                  {domains.map((d, j) => {
                    const missing = d.score == null;
                    const v       = missing ? null : domainScore(d.score);
                    const t       = missing ? null : scoreTier(v);
                    return (
                      <td key={j} style={{ padding: "14px 14px" }}>
                        {missing ? (
                          <span style={{ color: "#5C7382", fontSize: 13 }}>—</span>
                        ) : (
                          <span style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 18, padding: "14px 18px", borderRadius: 12, background: "#F7FAF9", fontSize: 12.5, color: "#3D5563", lineHeight: 1.6, border: "1px solid rgba(28,58,68,0.09)" }}>
        <strong style={{ color: "#1C2F3A" }}>Score Interpretation:</strong>{" "}
        <span style={{ color: "#0F6B45", fontWeight: 700 }}>■ 70–100 Healthy Range</span> ·{" "}
        <span style={{ color: "#92400E", fontWeight: 700 }}>■ 50–69 Within Variation</span> ·{" "}
        <span style={{ color: "#991B1B", fontWeight: 700 }}>■ 0–49 Worth Monitoring</span>.
        Performance variation between sessions is common and influenced by rest, hydration, stress, and test familiarization.
      </div>
    </div>
  );
}

// ── Main Progress Portal ──────────────────────────────────────────────────────
export default function ProgressPage({ setPage }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  useEffect(() => {
    setLoading(true);
    getMyResults()
      .then(results => setHistory(results || []))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hasData = history.length > 0;

  const labels = hasData
    ? history.map(h => {
        const raw = h.createdAt || h.timestamp;
        if (!raw) return "—";
        const d = new Date(raw);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })
    : [];

  const speechData   = hasData ? history.map(h => domainScore(h.speech_score))    : [];
  const memoryData   = hasData ? history.map(h => domainScore(h.memory_score))    : [];
  const reactionData = hasData ? history.map(h => domainScore(h.reaction_score))  : [];
  const execData     = hasData ? history.map(h => domainScore(h.executive_score)) : [];
  const motorData    = hasData ? history.map(h => domainScore(h.motor_score))     : [];
  const overallData  = hasData ? history.map(entryOverall) : [];

  const latestOverall = overallData.length ? overallData[overallData.length - 1] : null;
  const latestTier    = scoreTier(latestOverall ?? 0);

  const prevOverall = overallData.length >= 2 ? overallData[overallData.length - 2] : null;
  const scoreDiff = latestOverall != null && prevOverall != null ? latestOverall - prevOverall : null;

  const latestComposite = hasData && history[history.length - 1]?.composite_risk_score != null
    ? Math.round(history[history.length - 1].composite_risk_score)
    : null;

  const avgWellness = overallData.length
    ? Math.round(overallData.reduce((a, b) => a + b, 0) / overallData.length)
    : null;

  const domains = [
    { label: "Speech",    icon: "🎙️", data: speechData,   color: RED  },
    { label: "Memory",    icon: "🧠", data: memoryData,   color: BLU  },
    { label: "Reaction",  icon: "⚡", data: reactionData, color: AMB  },
    { label: "Executive", icon: "🎯", data: execData,     color: PUR  },
    { label: "Motor",     icon: "🥁", data: motorData,    color: LIME },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 1040, margin: "0 auto", paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(42,143,138,0.10)", border: `1px solid ${LIME}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 12, fontSize: 11, fontWeight: 700, color: LIME, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
          Longitudinal Cognitive Tracking
        </div>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", color: "#1C2F3A", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 8 }}>
          Your Progress Portal
        </h1>
        <p style={{ color: "#5C7382", fontSize: 15, fontWeight: 500, maxWidth: 640, lineHeight: 1.6 }}>
          {hasData
            ? `${history.length} assessment session${history.length > 1 ? "s" : ""} recorded. Continuous trend monitoring provides valuable insight into your cognitive wellness.`
            : "Complete cognitive assessments to build your personal baseline and monitor long-term trends."}
        </p>
      </div>

      {loading && (
        <div style={{ color: "#5C7382", fontSize: 15, padding: "60px 0", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading your progress history…
        </div>
      )}

      {/* Error alert using Section 9 RED warning alert treatment */}
      {err && (
        <div style={{
          background: "#FEF2F2",
          border: "1.5px solid #FCA5A5",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          color: "#991B1B",
          fontSize: 14,
          fontWeight: 700,
          display: "flex",
          gap: 12,
          alignItems: "center",
          boxShadow: "0 4px 14px rgba(220,38,38,0.06)",
        }}>
          <span style={{ fontSize: 20, color: "#DC2626" }}>⚠️</span>
          <span>{err}</span>
        </div>
      )}

      {/* ── No Data State ── */}
      {!loading && !hasData && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: 20,
          padding: "56px 40px",
          textAlign: "center",
          border: "1.5px solid rgba(28,58,68,0.12)",
          boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
          <h2 style={{ fontWeight: 900, fontSize: 24, color: "#1C2F3A", marginBottom: 8 }}>
            No Assessment Data Yet
          </h2>
          <p style={{ color: "#5C7382", fontSize: 15, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Take your first 5-test assessment to establish your personal baseline and unlock full neural pattern analytics.
          </p>
          {setPage && (
            <Btn onClick={() => setPage("assessments")} style={{ fontSize: 15, padding: "14px 28px" }}>
              Start Assessment →
            </Btn>
          )}
        </div>
      )}

      {/* ── Populated Progress Dashboard ── */}
      {!loading && hasData && (
        <>
          {/* ── 4 Top Summary Cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            {/* Card 1: Overall Wellness Score */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "22px 24px",
              border: "1.5px solid rgba(28,58,68,0.12)",
              boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
            }}>
              <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Current Wellness Score
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 900, fontSize: 38, color: latestTier.color, lineHeight: 1 }}>
                  {latestOverall ?? "—"}
                </span>
                <span style={{ fontSize: 14, color: "#5C7382", paddingBottom: 4 }}>/100</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: latestTier.bg, color: latestTier.color, border: `1px solid ${latestTier.border}` }}>
                  {latestTier.label}
                </span>
                {scoreDiff !== null && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreDiff > 0 ? GRN : scoreDiff < 0 ? RED : AMB }}>
                    {scoreDiff > 0 ? `↑ +${scoreDiff}` : scoreDiff < 0 ? `↓ ${scoreDiff}` : "→ 0"} vs prev
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Assessments Completed */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "22px 24px",
              border: "1.5px solid rgba(28,58,68,0.12)",
              boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
            }}>
              <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Assessments Completed
              </div>
              <div style={{ fontWeight: 900, fontSize: 38, color: "#1C2F3A", lineHeight: 1, marginBottom: 6 }}>
                {history.length}
              </div>
              <div style={{ fontSize: 12, color: "#5C7382", fontWeight: 600 }}>
                {labels.length ? `Latest: ${labels[labels.length - 1]}` : "Active Tracking"}
              </div>
            </div>

            {/* Card 3: Overall Trajectory / Trend */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "22px 24px",
              border: "1.5px solid rgba(28,58,68,0.12)",
              boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
            }}>
              <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Longitudinal Trend
              </div>
              <div style={{ marginTop: 4, marginBottom: 8 }}>
                <TrendBadge data={overallData} />
              </div>
              <div style={{ fontSize: 12, color: "#5C7382", lineHeight: 1.4 }}>
                {overallData.length >= 2
                  ? (latestOverall >= overallData[0] ? "Maintaining positive stability" : "Slight fluctuation observed")
                  : "First session baseline recorded"}
              </div>
            </div>

            {/* Card 4: Historical Average */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: 18,
              padding: "22px 24px",
              border: "1.5px solid rgba(28,58,68,0.12)",
              boxShadow: "0 6px 20px rgba(28,47,58,0.05)",
            }}>
              <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Session Average
              </div>
              <div style={{ fontWeight: 900, fontSize: 38, color: LIME, lineHeight: 1, marginBottom: 6 }}>
                {avgWellness ?? "—"}
                <span style={{ fontSize: 14, color: "#5C7382", paddingBottom: 4 }}>/100</span>
              </div>
              <div style={{ fontSize: 12, color: "#5C7382", fontWeight: 600 }}>
                {latestComposite != null ? `Risk Index: ${latestComposite}%` : "5 Clinical Domains"}
              </div>
            </div>
          </div>

          {/* ── Main Wellness Trend Chart Card ── */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 22,
            padding: "30px 34px",
            marginBottom: 24,
            border: "1.5px solid rgba(28,58,68,0.12)",
            boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: LIME, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
                  ● Overall Wellness Timeline
                </div>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: "#1C2F3A", margin: 0 }}>
                  Longitudinal Cognitive Performance
                </h2>
                <p style={{ fontSize: 13, color: "#5C7382", marginTop: 4, margin: 0 }}>
                  Tracking continuous wellness scores across completed assessment sessions
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <TrendBadge data={overallData} />
                <span style={{ fontSize: 13, color: latestTier.color, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: latestTier.bg, border: `1px solid ${latestTier.border}` }}>
                  {latestTier.label} Status
                </span>
              </div>
            </div>

            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <Sparkline data={overallData} color={latestTier.color} height={110} />
            </div>

            {labels.length > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, borderTop: "1px solid rgba(28,58,68,0.08)", paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: "#5C7382", fontWeight: 700 }}>First Session: {labels[0]}</span>
                <span style={{ fontSize: 12, color: "#5C7382", fontWeight: 700 }}>Latest Session: {labels[labels.length - 1]}</span>
              </div>
            )}
          </div>

          {/* ── Domain Breakdown Grid ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 12 }}>
              Domain Breakdown & Trends
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
              {domains.map(d => (
                <DomainTrack key={d.label} {...d} labels={labels} />
              ))}
            </div>
          </div>

          {/* ── Score Interpretation Guide ── */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            padding: "26px 30px",
            marginTop: 24,
            marginBottom: 24,
            border: "1.5px solid rgba(28,58,68,0.12)",
            boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
          }}>
            <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 16, marginBottom: 14 }}>
              Understanding Your Cognitive Scores
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {[
                { range: "70–100", label: "Healthy Range", color: "#0F6B45", bg: "#DCFCE7", border: "#86EFAC", desc: "Performance conforms with typical expected baselines for age cohort." },
                { range: "50–69",  label: "Within Variation", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", desc: "Minor variability observed. Frequently attributable to fatigue, test hour, or novelty." },
                { range: "0–49",   label: "Worth Monitoring", color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", desc: "Below normative threshold. Recommended to retest and review with care physician." },
              ].map(s => (
                <div key={s.range} style={{ padding: "16px 18px", borderRadius: 14, background: s.bg, border: `1px solid ${s.border}` }}>
                  <div style={{ fontWeight: 900, fontSize: 22, color: s.color, marginBottom: 4 }}>{s.range}</div>
                  <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 14, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "#3D5563", lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Assessment History Table ── */}
          <HistoryTable history={history} />

          {/* ── Take Assessment Action Card ── */}
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            marginTop: 24,
            padding: "26px 30px",
            border: `1.5px solid rgba(42,143,138,0.25)`,
            boxShadow: "0 8px 24px rgba(28,47,58,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
          }}>
            <div>
              <div style={{ fontSize: 11, color: LIME, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
                ● Continuous Monitoring
              </div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#1C2F3A", marginBottom: 4 }}>
                Ready for your next assessment?
              </div>
              <div style={{ fontSize: 14, color: "#5C7382" }}>
                Retesting periodically builds the most statistically reliable trend analysis.
              </div>
            </div>
            {setPage && (
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => setPage("assessments")} style={{ fontSize: 14, padding: "12px 24px" }}>
                  Start Assessment →
                </Btn>
                <Btn variant="ghost" onClick={() => setPage("results")} style={{ fontSize: 14, padding: "12px 20px" }}>
                  View Full Report
                </Btn>
              </div>
            )}
          </div>

          {/* ── Section 8 & 9: Red Medical Disclaimer Alert on Progress ── */}
          <div style={{
            background: "#FEF2F2",
            border: "2px solid #F87171",
            borderRadius: 16,
            padding: "24px 28px",
            marginTop: 24,
            boxShadow: "0 4px 18px rgba(220,38,38,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20, color: "#DC2626" }}>⚠️</span>
              <span style={{ fontWeight: 800, color: "#991B1B", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Medical Disclaimer
              </span>
            </div>
            <p style={{ color: "#7F1D1D", fontSize: 13.5, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
              NeuroAid provides cognitive screening insights and does not diagnose medical conditions. Longitudinal trend monitoring is designed for personal awareness and doctor discussion only. Results should be reviewed with a qualified healthcare professional.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
