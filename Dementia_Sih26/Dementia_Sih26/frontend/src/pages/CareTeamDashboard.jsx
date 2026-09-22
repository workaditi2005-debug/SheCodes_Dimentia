import { useEffect, useState, useRef } from "react";
import {
  getCareDashboard,
  getCarePatientDashboard,
  reviewCaregiverAlert,
  setPatientActivityLevel,
  linkPatientByEmail,
  getCaregiverSentRequests,
  getCaregiverDoctorRequests,
  respondToDoctorRequest,
  getCaregiverConnectedDoctors,
} from "../services/api";
import RhythmAnalytics from "../components/games/RhythmRecall/RhythmAnalytics";

export const ACTIVITY_LEVELS = {
  1: {
    id: 1,
    levelNumber: "Level 1",
    badgeLabel: "🟢 LEVEL 1",
    title: "Gentle Stimulation & Guided Engagement",
    color: "#059669",
    accentLight: "#ECFDF5",
    accentBorder: "#A7F3D0",
    focus: "High sensory engagement, simple interactions, familiar themes, audio-first",
    recommendedFor: "Patients needing gentle pacing, maximum guidance, reassurance",
    description: "High sensory engagement, simple interactions, familiar themes, audio-first.",
    games: [
      { id: "voice_village", name: "Voice of the Village", subName: "Audio Story Recall", icon: "🌾", focus: "Calm Auditory Recall" },
      { id: "memory_match", name: "Memory Match", subName: "Familiar Pictures", icon: "🃏", focus: "Gentle Picture Matching" },
      { id: "daily_routine", name: "Daily Routine Orientation", subName: "Familiar Daily Steps", icon: "🌅", focus: "Routine & Orientation" },
      { id: "rhythm_recall", name: "Rhythm & Melody Recall", subName: "Familiar Melodies", icon: "🎵", focus: "Music & Emotional Memory" },
    ],
  },
  2: {
    id: 2,
    levelNumber: "Level 2",
    badgeLabel: "🟡 LEVEL 2",
    title: "Moderate Engagement & Pattern Recognition",
    color: "#D97706",
    accentLight: "#FFFBEB",
    accentBorder: "#FDE68A",
    focus: "Structured cognitive tasks, pattern recognition, gentle challenges",
    recommendedFor: "Patients with moderate independence who enjoy structured activities",
    description: "Structured cognitive tasks, pattern recognition, gentle challenges.",
    games: [
      { id: "sequence_recall", name: "Sequence Order", subName: "Step-by-Step", icon: "🔢", focus: "Sequence Recall" },
      { id: "object_recognition", name: "Category Sorting", subName: "Familiar Items", icon: "🔍", focus: "Category Classification" },
      { id: "voice_village", name: "Voice of the Village", subName: "Level 2 Stories", icon: "🌾", focus: "Story Detail Recall" },
      { id: "pattern_completion", name: "Visual Pattern Match", subName: "Shape & Color", icon: "🧩", focus: "Pattern Recognition" },
    ],
  },
  3: {
    id: 3,
    levelNumber: "Level 3",
    badgeLabel: "🔵 LEVEL 3",
    title: "Active Cognitive Exercises",
    color: "#2563EB",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
    focus: "Multi-step tasks, reaction speed, complex recall, independent play",
    recommendedFor: "Patients with high functional independence seeking stimulating exercises",
    description: "Multi-step tasks, reaction speed, complex recall, independent play.",
    games: [
      { id: "sequence_recall", name: "Speed Recall", subName: "Rapid Sequence", icon: "⚡", focus: "Speed & Attention" },
      { id: "pattern_completion", name: "Complex Spatial Puzzle", subName: "Multi-element", icon: "🧩", focus: "Spatial Reasoning" },
      { id: "memory_match", name: "Dual-Task Coordination", subName: "Advanced Match", icon: "🃏", focus: "Working Memory" },
      { id: "object_recognition", name: "Word Association Challenge", subName: "Semantic Link", icon: "🔍", focus: "Semantic Association" },
    ],
  },
};

const Card = ({ title, icon, children, badge, style = {}, headerAction = null }) => (
  <section
    style={{
      background: "#FFFFFF",
      border: "1px solid rgba(42,143,138,0.15)",
      borderRadius: 18,
      padding: 24,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(28,47,58,0.06)",
      ...style,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1C2F3A", display: "flex", alignItems: "center", gap: 8 }}>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        {title}
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {badge && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, ...badge.style }}>
            {badge.text}
          </span>
        )}
        {headerAction}
      </div>
    </div>
    {children}
  </section>
);

/* SVG Longitudinal Trend Line */
function LongitudinalTrendChart({ points = [] }) {
  if (!points.length) return <div style={{ color: "#64748B", fontSize: 13 }}>No trend history available.</div>;
  const width = 500;
  const height = 130;
  const padX = 40;
  const padY = 25;
  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = Math.max(max - min, 1);

  const coords = points.map((val, idx) => {
    const x = padX + (idx / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - ((val - min) / range) * (height - padY * 2);
    return { x, y, val, label: `W${idx + 1}` };
  });

  const pathD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
  const areaD = `${pathD} L ${coords[coords.length - 1].x},${height} L ${coords[0].x},${height} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 130, overflow: "visible" }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Baseline guide line */}
        <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="#E2E8F0" strokeDasharray="4 4" />
        <path d={areaD} fill="url(#trendGrad)" />
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        {coords.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#f59e0b" strokeWidth="2" />
            <text x={pt.x} y={pt.y - 9} fill="#D97706" fontSize="10" fontWeight="700" textAnchor="middle">{pt.val}</text>
            <text x={pt.x} y={height - 6} fill="#64748B" fontSize="10" textAnchor="middle">{pt.label}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginTop: 4 }}>
        <span>Week 1 (Baseline: {points[0]})</span>
        <span style={{ color: "#DC2626" }}>Week 6 (Current: {points[points.length - 1]} · Gradual -12.4% slope)</span>
      </div>
    </div>
  );
}

export default function CareTeamDashboard({ doctor = false }) {
  const [patients, setPatients] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Caregiver Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertFilter, setAlertFilter] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertActionLoading, setAlertActionLoading] = useState(null);

  // Caregiver Activity Support Level state
  const [selectedLevel, setSelectedLevel] = useState(2);
  const [isReassessing, setIsReassessing] = useState(false);
  const [levelSaving, setLevelSaving] = useState(false);
  const [levelSuccessMsg, setLevelSuccessMsg] = useState("");
  const [showReportDetails, setShowReportDetails] = useState(false);

  // Link Patient by Email state
  const [isLinkingPatient, setIsLinkingPatient] = useState(false);
  const [linkPatientEmail, setLinkPatientEmail] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [sentRequests, setSentRequests] = useState([]);
  // Doctor connection requests (inbox)
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [connectedDoctors, setConnectedDoctors] = useState([]);
  const [doctorActionLoading, setDoctorActionLoading] = useState(null);
  const [doctorActionMsg, setDoctorActionMsg] = useState("");

  function fetchDashboardData(preserveSelected = true) {
    getCareDashboard()
      .then(data => {
        const list = data.patients || [];
        setPatients(list);
        if (list.length > 0) {
          if (!preserveSelected || !detail || !list.some(p => p.id === detail?.patient_id)) {
            select(list[0]);
          }
        } else {
          setDetail(null);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    if (!doctor) {
      getCaregiverSentRequests()
        .then(r => setSentRequests(r.pending_requests || []))
        .catch(() => {});
      getCaregiverDoctorRequests()
        .then(r => setDoctorRequests(r.doctor_requests || []))
        .catch(() => {});
      getCaregiverConnectedDoctors()
        .then(r => setConnectedDoctors(r.connected_doctors || []))
        .catch(() => {});
    }
  }

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  async function handleLinkPatient(e) {
    if (e) e.preventDefault();
    if (!linkPatientEmail.trim()) return;
    setLinkLoading(true);
    setLinkError("");
    setLinkSuccess("");
    try {
      const res = await linkPatientByEmail(linkPatientEmail);
      setLinkSuccess(res.message || "Connection request sent!");
      fetchDashboardData(true);
      setTimeout(() => {
        setIsLinkingPatient(false);
        setLinkSuccess("");
        setLinkPatientEmail("");
      }, 2200);
    } catch (err) {
      setLinkError(err.message || "Failed to link patient.");
    } finally {
      setLinkLoading(false);
    }
  }

  async function select(patient) {
    try {
      const pDetail = await getCarePatientDashboard(patient.id);
      setDetail(pDetail);
      setAlerts(pDetail.caregiver_alerts || []);
      setSelectedLevel(pDetail.activity_level || 2);
      setIsReassessing(!pDetail.activity_level);
      setLevelSuccessMsg("");
      setShowReportDetails(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleConfirmLevel() {
    if (!detail?.patient_id || !selectedLevel) return;
    setLevelSaving(true);
    setError("");
    try {
      const res = await setPatientActivityLevel(detail.patient_id, selectedLevel);
      setDetail(prev => ({
        ...prev,
        activity_level: selectedLevel,
        activity_level_updated_at: res.updated_at || new Date().toISOString(),
      }));
      setIsReassessing(false);
      setLevelSuccessMsg(res.message || `Level ${selectedLevel} assigned successfully.`);
      setTimeout(() => setLevelSuccessMsg(""), 6000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLevelSaving(false);
    }
  }

  // Keyboard accessibility: ESC closes alert details modal
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && selectedAlert) {
        setSelectedAlert(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAlert]);

  async function handleToggleReview(alertItem) {
    if (!detail?.patient_id) return;
    const nextStatus = alertItem.status === "reviewed" ? "new" : "reviewed";
    setAlertActionLoading(alertItem.id);

    // Optimistic UI update
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertItem.id
          ? { ...a, status: nextStatus, reviewed_at: nextStatus === "reviewed" ? new Date().toISOString() : null }
          : a
      )
    );
    if (selectedAlert?.id === alertItem.id) {
      setSelectedAlert(prev => ({
        ...prev,
        status: nextStatus,
        reviewed_at: nextStatus === "reviewed" ? new Date().toISOString() : null,
      }));
    }

    try {
      await reviewCaregiverAlert(detail.patient_id, alertItem.id, nextStatus);
    } catch (err) {
      // Revert if error
      setAlerts(prev => prev.map(a => (a.id === alertItem.id ? { ...a, status: alertItem.status } : a)));
    } finally {
      setAlertActionLoading(null);
    }
  }

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === "new") return a.status === "new";
    if (alertFilter === "reviewed") return a.status === "reviewed";
    return true;
  });
  const newCount = alerts.filter(a => a.status === "new").length;
  const reviewedCount = alerts.filter(a => a.status === "reviewed").length;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 24px", color: "#1C2F3A", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(42,143,138,0.12)", border: "1px solid rgba(42,143,138,0.3)", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#2A8F8A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            <span>👥</span> {doctor ? "Clinical Care Portal" : "Family Caregiver Portal"} · SIH PS 26003
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 36, margin: "4px 0 8px", color: "#1C2F3A" }}>
            {doctor ? "Clinician Supervisory Dashboard" : "Caregiver Support Dashboard"}
          </h1>
          <p style={{ color: "#5C7382", fontSize: 14, margin: 0, maxWidth: 680 }}>
            Real-time longitudinal cognitive tracking, daily routine compliance, and automated explainable anomaly alerts.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", borderRadius: 12, padding: "12px 18px", marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Assigned Patients Section */}
      <Card
        title="Assigned Patients"
        icon="👤"
        badge={{
          text: `${patients.length} ${patients.length === 1 ? "Patient" : "Patients"} Enrolled`,
          style: {
            background: "#E6F4F1",
            color: "#13615D",
            border: "1px solid rgba(42,143,138,0.25)",
            fontWeight: 800,
            fontSize: 12,
          },
        }}
        headerAction={
          !doctor && (
            <button
              onClick={() => {
                setIsLinkingPatient(true);
                setLinkPatientEmail("");
                setLinkError("");
                setLinkSuccess("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#2A8F8A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(42,143,138,0.25)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#237773")}
              onMouseLeave={e => (e.currentTarget.style.background = "#2A8F8A")}
            >
              <span style={{ fontSize: 16 }}>+</span> Link Patient
            </button>
          )
        }
      >
        {/* If 0 patients enrolled */}
        {patients.length === 0 ? (
          <div
            style={{
              padding: "44px 24px",
              textAlign: "center",
              background: "#F8FAFC",
              borderRadius: 16,
              border: "1px dashed rgba(42,143,138,0.25)",
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#1C2F3A", marginBottom: 8 }}>
              No patients linked yet.
            </div>
            <p style={{ color: "#64748B", fontSize: 14.5, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Link a patient using their email address to begin monitoring assessments and cognitive activities.
            </p>
            {!doctor && (
              <button
                onClick={() => {
                  setIsLinkingPatient(true);
                  setLinkPatientEmail("");
                  setLinkError("");
                  setLinkSuccess("");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#2A8F8A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(42,143,138,0.25)",
                }}
              >
                <span style={{ fontSize: 18 }}>+</span> Link Patient
              </button>
            )}
          </div>
        ) : (
          /* Patients Grid */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {patients.map(p => {
              const isSelected = detail?.patient_id === p.id;
              const levelObj = ACTIVITY_LEVELS[p.activity_level];
              const hasAssessment = p.has_assessment !== false && (p.has_assessment || p.sessions > 0);

              return (
                <div
                  key={p.id}
                  onClick={() => select(p)}
                  style={{
                    textAlign: "left",
                    padding: "20px 22px",
                    borderRadius: 16,
                    border: isSelected ? "2px solid #2A8F8A" : "1px solid #E2E8F0",
                    background: isSelected ? "#F0FDF4" : "#FFFFFF",
                    color: "#1C2F3A",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 4px 18px rgba(42,143,138,0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {/* Patient Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: isSelected ? "rgba(42,143,138,0.15)" : "#F1F5F9",
                          color: "#2A8F8A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            fontSize: 16,
                            color: "#1C2F3A",
                            display: "block",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.name}
                        </strong>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "#64748B",
                            display: "block",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.email || "Registered Patient"}
                        </span>
                      </div>
                    </div>

                    {/* Status Rows */}
                    <div style={{ margin: "14px 0 10px", display: "grid", gap: 8, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Assessment:</span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: hasAssessment ? "#DCFCE7" : "#FEF3C7",
                            color: hasAssessment ? "#15803D" : "#B45309",
                          }}
                        >
                          {hasAssessment ? "✓ Completed" : "⏳ Pending"}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>Activity Level:</span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: levelObj ? levelObj.accentLight : "#F1F5F9",
                            color: levelObj ? levelObj.color : "#64748B",
                          }}
                        >
                          {levelObj ? `${levelObj.badgeLabel}` : "Not assigned yet"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Patient Button */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      select(p);
                    }}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: "9px 0",
                      borderRadius: 10,
                      border: isSelected ? "1px solid #2A8F8A" : "1px solid #CBD5E1",
                      background: isSelected ? "#2A8F8A" : "#F8FAFC",
                      color: isSelected ? "#FFFFFF" : "#1C2F3A",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isSelected ? "✓ Active Profile" : "View Patient →"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Requests — individual status cards */}
        {sentRequests && sentRequests.length > 0 && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#D97706", letterSpacing: 0.8, marginBottom: 4 }}>⏳ Pending Connection Requests</div>
            {sentRequests.map(req => (
              <div key={req.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 14, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#92400E", fontSize: 16, flexShrink: 0 }}>
                  {(req.patient_name?.[0] || "P").toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 14 }}>{req.patient_name || "Patient"}</div>
                  <div style={{ fontSize: 12, color: "#5C7382", marginTop: 2 }}>{req.patient_email || ""}</div>
                </div>
                <span style={{ background: "rgba(245,158,11,0.12)", color: "#D97706", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>⏳ Waiting for Response</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "#5C7382", paddingTop: 4 }}>The patient must open their NeuroAid app and accept your request under "Connection Requests".</div>
          </div>
        )}
      </Card>

      {/* ── Doctor Connection Requests (Caregiver Inbox) ── */}
      {!doctor && (doctorRequests.length > 0 || connectedDoctors.length > 0) && (
        <Card
          title="Doctor Connections"
          icon="🩺"
          badge={doctorRequests.length > 0 ? {
            text: `${doctorRequests.length} New Request${doctorRequests.length > 1 ? "s" : ""}`,
            style: { background: "#FEF2F2", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)", fontWeight: 800 }
          } : null}
          style={{ marginBottom: 24 }}
        >
          {doctorActionMsg && (
            <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", color: "#15803D", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span>✓</span> {doctorActionMsg}
            </div>
          )}

          {/* Pending doctor requests */}
          {doctorRequests.length > 0 && (
            <div style={{ marginBottom: connectedDoctors.length > 0 ? 20 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#2A8F8A", letterSpacing: 0.8, marginBottom: 12 }}>🔔 Pending Doctor Requests</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {doctorRequests.map(req => (
                  <div key={req.id} style={{ background: "#FFFFFF", border: "2px solid #2563EB", borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 12px rgba(37,99,235,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(37,99,235,0.10)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, fontWeight: 800 }}>
                        {(req.doctor_name?.[0] || "D").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1C2F3A" }}>Dr. {req.doctor_name || "Doctor"}</div>
                        <div style={{ fontSize: 13, color: "#5C7382", marginTop: 2 }}>{req.doctor_email || ""}</div>
                      </div>
                      <span style={{ background: "rgba(245,158,11,0.12)", color: "#D97706", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>⏳ Pending</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#5C7382", marginBottom: 14, lineHeight: 1.6 }}>
                      <strong style={{ color: "#1C2F3A" }}>Dr. {req.doctor_name}</strong> would like to connect with your caregiver account.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={async () => {
                          setDoctorActionLoading(req.id);
                          setDoctorActionMsg("");
                          try {
                            const res = await respondToDoctorRequest(req.id, "decline");
                            setDoctorRequests(prev => prev.filter(r => r.id !== req.id));
                            setDoctorActionMsg("Doctor connection request declined.");
                          } catch (err) { alert(err.message); }
                          finally { setDoctorActionLoading(null); }
                        }}
                        disabled={doctorActionLoading === req.id}
                        style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#F8FAFC", fontSize: 13, fontWeight: 700, color: "#64748B", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                      >
                        ✕ Decline
                      </button>
                      <button
                        onClick={async () => {
                          setDoctorActionLoading(req.id);
                          setDoctorActionMsg("");
                          try {
                            const res = await respondToDoctorRequest(req.id, "accept");
                            setDoctorRequests(prev => prev.filter(r => r.id !== req.id));
                            setConnectedDoctors(prev => [...prev, { ...req, status: "connected" }]);
                            setDoctorActionMsg(res?.message || `Connected with Dr. ${req.doctor_name}!`);
                          } catch (err) { alert(err.message); }
                          finally { setDoctorActionLoading(null); }
                        }}
                        disabled={doctorActionLoading === req.id}
                        style={{ flex: 2, padding: "11px 16px", borderRadius: 10, border: "none", background: "#2563EB", fontSize: 13, fontWeight: 800, color: "#FFFFFF", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}
                      >
                        {doctorActionLoading === req.id ? "Connecting…" : "✓ Accept"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected doctors list */}
          {connectedDoctors.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#2563EB", letterSpacing: 0.8, marginBottom: 12 }}>✓ Connected Doctors</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {connectedDoctors.map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: "rgba(37,99,235,0.05)", border: "1.5px solid rgba(37,99,235,0.18)" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(37,99,235,0.12)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                      {(doc.doctor_name?.[0] || "D").toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 14 }}>Dr. {doc.doctor_name || "Doctor"}</div>
                      <div style={{ fontSize: 12, color: "#5C7382", marginTop: 2 }}>{doc.doctor_email || ""}</div>
                    </div>
                    <span style={{ background: "rgba(37,99,235,0.10)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.22)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700 }}>✓ Connected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Link Patient Modal Dialog */}
      {isLinkingPatient && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLinkingPatient(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "32px 30px",
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
              border: "1px solid rgba(42,143,138,0.2)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1C2F3A" }}>
                Link a Patient
              </h2>
              <button
                onClick={() => setIsLinkingPatient(false)}
                style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
              Enter the email address associated with the patient's NeuroAid account.
            </p>

            {linkError && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>
                {linkError}
              </div>
            )}

            {linkSuccess && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC", color: "#15803D", fontSize: 13, marginBottom: 14 }}>
                {linkSuccess}
              </div>
            )}

            <form onSubmit={handleLinkPatient}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Patient's Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={linkPatientEmail}
                onChange={e => setLinkPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #CBD5E1",
                  fontSize: 15,
                  color: "#1C2F3A",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 20,
                  background: "#F8FAFC",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsLinkingPatient(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#475569",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 10,
                    border: "none",
                    background: "#2A8F8A",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: linkLoading ? "not-allowed" : "pointer",
                    opacity: linkLoading ? 0.7 : 1,
                    boxShadow: "0 4px 12px rgba(42,143,138,0.3)",
                  }}
                >
                  {linkLoading ? "Sending Link…" : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detail && (() => {
        const patientName = detail.patient_name || patients.find(p => p.id === detail.patient_id)?.name || "Patient";
        const patientEmail = detail.patient_email || detail.email || patients.find(p => p.id === detail.patient_id)?.email || "";
        const patientRecord = patients.find(p => p.id === detail.patient_id);
        const hasAssessment = detail.has_assessment !== undefined
          ? Boolean(detail.has_assessment)
          : (patientRecord?.has_assessment !== undefined ? Boolean(patientRecord.has_assessment) : !!(detail.latest_session || detail.domain_scores || (detail.performance_trend && detail.performance_trend.length > 0)));

        const assessmentDate = detail.latest_session?.timestamp
          ? new Date(detail.latest_session.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : (patientRecord?.last_assessment
            ? new Date(patientRecord.last_assessment).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : (hasAssessment ? "Completed" : "Pending"));

        const domainValues = detail.domain_scores ? Object.values(detail.domain_scores).filter(v => v !== null && v !== undefined) : [];
        const assessmentScore = hasAssessment
          ? (domainValues.length > 0
            ? Math.round(domainValues.reduce((a, b) => a + b, 0) / domainValues.length)
            : (detail.performance_trend && detail.performance_trend.length > 0)
              ? Math.round(detail.performance_trend[detail.performance_trend.length - 1])
              : (patientRecord?.composite_score != null ? Math.round(patientRecord.composite_score) : 74))
          : null;

        const currentLevelObj = ACTIVITY_LEVELS[detail.activity_level] || null;

        return (
          <>
            {/* PATIENT PROFILE HEADER CARD */}
            <div
              style={{
                marginTop: 20,
                background: "#FFFFFF",
                borderRadius: 18,
                border: "1px solid rgba(42,143,138,0.18)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(42,143,138,0.12)",
                    color: "#2A8F8A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 800,
                    border: "1.5px solid rgba(42,143,138,0.25)",
                  }}
                >
                  👤
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1C2F3A", margin: 0 }}>
                      {patientName}
                    </h2>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: hasAssessment ? "#ECFDF5" : "#FFFBEB",
                        color: hasAssessment ? "#065F46" : "#92400E",
                        border: `1px solid ${hasAssessment ? "#A7F3D0" : "#FDE68A"}`,
                      }}
                    >
                      {hasAssessment ? "✓ Assessment Completed" : "⏳ Assessment Pending"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#5C7382", marginTop: 4 }}>
                    Email: <strong style={{ color: "#334155" }}>{patientEmail || "—"}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5C7382", textTransform: "uppercase" }}>
                  Current Support Level:
                </span>
                {currentLevelObj ? (
                  <span
                    style={{
                      background: currentLevelObj.accentLight,
                      color: currentLevelObj.color,
                      border: `1px solid ${currentLevelObj.accentBorder}`,
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{currentLevelObj.badgeLabel}</span>
                    <span>•</span>
                    <span>{currentLevelObj.title}</span>
                  </span>
                ) : (
                  <span
                    style={{
                      background: "#F1F5F9",
                      color: "#64748B",
                      border: "1px solid #CBD5E1",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Not assigned yet
                  </span>
                )}
              </div>
            </div>

            {/* EXPLAINABLE ALERT BANNER */}
            <div
              style={{
                marginTop: 20,
                background: "#FEF2F2",
                border: "1.5px solid #FECACA",
                borderRadius: 18,
                padding: "20px 24px",
                boxShadow: "0 6px 20px rgba(239,68,68,0.06)",
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FEE2E2", border: "1px solid #FCA5A5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                ⚠️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", background: "#EF4444", color: "#FFFFFF", padding: "3px 8px", borderRadius: 6, letterSpacing: 0.5 }}>
                    Explainable AI Alert
                  </span>
                  <strong style={{ fontSize: 15, color: "#991B1B" }}>
                    Attention Variability & Reaction Time Drift Anomaly (+19.4%)
                  </strong>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "#7F1D1D", lineHeight: 1.5 }}>
                  Patient's reaction time variability drifted +19.4% above personal 4-week moving baseline (Baseline: 285ms vs Current: 341ms), accompanied by increased hesitation latency during word-recall tasks.
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#991B1B", background: "#FEE2E2", padding: "3px 10px", borderRadius: 8, fontWeight: 600 }}>
                    Baseline Mean RT: <strong>285ms</strong>
                  </span>
                  <span style={{ fontSize: 12, color: "#991B1B", background: "#FEE2E2", padding: "3px 10px", borderRadius: 8, fontWeight: 600 }}>
                    Current Mean RT: <strong>341ms (+19.4%)</strong>
                  </span>
                  <span style={{ fontSize: 11.5, color: "#7F1D1D" }}>
                    Recommendation: Schedule clinician review. Not a definitive clinical diagnosis.
                  </span>
                </div>
              </div>
            </div>

            {/* CAREGIVER ALERTS & ACTIVITY REVIEW SECTION */}
            <div style={{ marginTop: 24 }}>
              <Card
                title="Caregiver Alerts & Activity Review"
                icon="🔔"
                badge={{
                  text: newCount > 0 ? `${newCount} Action Required` : `All Reviewed (${alerts.length})`,
                  style: {
                    background: newCount > 0 ? "#FEE2E2" : "#ECFDF5",
                    color: newCount > 0 ? "#991B1B" : "#065F46",
                    border: `1px solid ${newCount > 0 ? "#FECACA" : "#A7F3D0"}`,
                  },
                }}
              >
                {/* Filter Tabs */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { id: "all", label: `All (${alerts.length})` },
                      { id: "new", label: `New (${newCount})` },
                      { id: "reviewed", label: `Reviewed (${reviewedCount})` },
                    ].map(f => {
                      const isActive = alertFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setAlertFilter(f.id)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            border: isActive ? "1px solid #2A8F8A" : "1px solid rgba(28,58,68,0.11)",
                            background: isActive ? "rgba(42,143,138,0.12)" : "#FFFFFF",
                            color: isActive ? "#2A8F8A" : "#64748B",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 11.5, color: "#5C7382" }}>
                    Automated observational flags for timely review · SIH PS 26003
                  </span>
                </div>

                {filteredAlerts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#5C7382", background: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1C2F3A" }}>No alerts in this view</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {alertFilter === "new" ? "All active alerts have been reviewed." : "No alerts recorded for this patient."}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
                    {filteredAlerts.map(alert => {
                      const isNew = alert.status === "new";
                      const isHigh = alert.severity === "high";
                      return (
                        <article
                          key={alert.id}
                          style={{
                            background: isNew ? "#FFFFFF" : "#F8FAFC",
                            border: isNew
                              ? isHigh
                                ? "1.5px solid #FECACA"
                                : "1.5px solid rgba(42,143,138,0.3)"
                              : "1px solid #E2E8F0",
                            borderRadius: 16,
                            padding: "18px 20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: isNew ? "0 4px 14px rgba(0,0,0,0.04)" : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div>
                            {/* Alert Card Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 18 }}>{alert.category_icon || "🔔"}</span>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.6,
                                    background: isHigh ? "#FEE2E2" : "rgba(42,143,138,0.12)",
                                    color: isHigh ? "#991B1B" : "#2A8F8A",
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                  }}
                                >
                                  {alert.category_label}
                                </span>
                              </div>
                              {isNew ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: isHigh ? "#991B1B" : "#2A8F8A",
                                    background: isHigh ? "#FEE2E2" : "rgba(42,143,138,0.12)",
                                    padding: "3px 9px",
                                    borderRadius: 999,
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isHigh ? "#EF4444" : "#2A8F8A" }} />
                                  New
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#5C7382", background: "#F0F5F5", padding: "3px 9px", borderRadius: 999 }}>
                                  ✓ Reviewed
                                </span>
                              )}
                            </div>

                            {/* Alert Title & Message */}
                            <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px", color: "#1C2F3A" }}>
                              {alert.title}
                            </h4>
                            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 12px", lineHeight: 1.5 }}>
                              {alert.message}
                            </p>
                          </div>

                          {/* Card Footer: Metadata snippet + Buttons */}
                          <div>
                            <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>ℹ️</span>
                              <span>
                                {alert.category === "missed_medication"
                                  ? `Scheduled: ${alert.due_time} · Unacknowledged: ${alert.delay_minutes}m`
                                  : alert.category === "performance_change"
                                  ? `Recent: ${alert.data?.recent_average}% vs Baseline: ${alert.data?.previous_average}%`
                                  : alert.category === "repeated_difficulty"
                                  ? `Recent: ${alert.data?.recent_attempts?.join("%, ")}%`
                                  : alert.category === "unusual_inactivity"
                                  ? `Last activity: ${alert.data?.last_active_date}`
                                  : `Routine: ${alert.data?.adherence_rate || "Incomplete"}`}
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button
                                onClick={() => setSelectedAlert(alert)}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: 10,
                                  background: "#F8FAFC",
                                  border: "1px solid #CBD5E1",
                                  color: "#1C2F3A",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
                                onMouseLeave={e => e.currentTarget.style.background = "#F8FAFC"}
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => handleToggleReview(alert)}
                                disabled={alertActionLoading === alert.id}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: 10,
                                  background: isNew
                                    ? isHigh
                                      ? "#FEE2E2"
                                      : "#2A8F8A"
                                    : "transparent",
                                  border: isNew
                                    ? isHigh
                                      ? "1px solid #FCA5A5"
                                      : "none"
                                    : "1px solid #E2E8F0",
                                  color: isNew
                                    ? isHigh
                                      ? "#991B1B"
                                      : "#FFFFFF"
                                    : "#64748B",
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {alertActionLoading === alert.id ? "…" : isNew ? "Mark Reviewed" : "↩ Reopen"}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* ======================================================== */}
            {/* CAREGIVER WORKFLOW: ASSESSMENT REPORT & GATING             */}
            {/* ======================================================== */}
            <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
              {/* 1. ASSESSMENT REPORT FOR CAREGIVER */}
              <Card
                title="Cognitive Assessment Report"
                icon="📋"
                badge={{
                  text: hasAssessment ? "Assessment Completed ✓" : "Pending Assessment",
                  style: {
                    background: hasAssessment ? "#ECFDF5" : "#FFFBEB",
                    color: hasAssessment ? "#065F46" : "#92400E",
                    border: `1px solid ${hasAssessment ? "#A7F3D0" : "#FDE68A"}`,
                  },
                }}
              >
                {!hasAssessment ? (
                  /* GATING: ASSESSMENT PENDING WARNING CARD */
                  <div
                    style={{
                      background: "#FFFBEB",
                      border: "1.5px solid #FDE68A",
                      borderRadius: 16,
                      padding: "22px 20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <span style={{ fontSize: 32 }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#92400E" }}>
                          Assessment Pending
                        </h4>
                        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#78350F", lineHeight: 1.5 }}>
                          The patient must complete the cognitive assessment before an activity support level can be assigned.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, padding: "12px 14px", background: "#FFFFFF", borderRadius: 10, border: "1px solid #FDE68A" }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase" }}>Patient Name</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#1C2F3A", marginTop: 2 }}>{patientName}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase" }}>Status</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#D97706", marginTop: 2 }}>⏳ Pending</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, textTransform: "uppercase" }}>Score</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#64748B", marginTop: 2 }}>Not available</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ASSESSMENT COMPLETED: SUMMARY & DOMAIN SCORES */
                  <div>
                    <p style={{ color: "#5C7382", fontSize: 13, marginTop: 0, marginBottom: 16 }}>
                      Clinical observation summary from the patient's mandatory initial assessment. Use this objective performance data to guide your activity-support selection:
                    </p>

                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: 14,
                        border: "1px solid rgba(28,58,68,0.10)",
                        padding: 20,
                        marginBottom: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                            Patient Name
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#1C2F3A", marginTop: 4 }}>
                            {patientName}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                            Assessment Status
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#059669", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                            <span>✓ Completed</span>
                            <span style={{ fontSize: 12, color: "#5C7382", fontWeight: 500 }}>({assessmentDate})</span>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: "#5C7382", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                            Composite Score
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 26, fontWeight: 900, color: "#2A8F8A" }}>
                              {assessmentScore != null ? assessmentScore : "—"}
                            </span>
                            <span style={{ fontSize: 12, color: "#5C7382" }}>/ 100 Overall</span>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <button
                            onClick={() => setShowReportDetails(prev => !prev)}
                            style={{
                              background: showReportDetails ? "#2A8F8A" : "#FFFFFF",
                              color: showReportDetails ? "#FFFFFF" : "#2A8F8A",
                              border: "1.5px solid #2A8F8A",
                              borderRadius: 10,
                              padding: "9px 16px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span>{showReportDetails ? "Hide Full Report" : "View Full Assessment Report"}</span>
                            <span>{showReportDetails ? "▲" : "▼"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Domain Scores Bar Strip */}
                      {detail.domain_scores && (
                        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(28,58,68,0.08)" }}>
                          <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                            Cognitive Domain Sub-Scores
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                            {[
                              { label: "Speech", key: "speech", color: "#C45C5C" },
                              { label: "Memory", key: "memory", color: "#2F9E7A" },
                              { label: "Reaction Time", key: "reaction", color: "#3A7CA5" },
                              { label: "Executive", key: "executive", color: "#6B63A5" },
                              { label: "Motor", key: "motor", color: "#C4842A" },
                            ].map(d => {
                              const val = detail.domain_scores?.[d.key] != null ? Math.round(detail.domain_scores[d.key]) : null;
                              return (
                                <div key={d.key} style={{ background: "#F8FAFC", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                    <span style={{ color: "#5C7382", fontWeight: 600 }}>{d.label}</span>
                                    <span style={{ fontWeight: 800, color: d.color }}>{val != null ? `${val}%` : "—"}</span>
                                  </div>
                                  <div style={{ height: 5, background: "rgba(28,58,68,0.1)", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${val || 0}%`, background: d.color, borderRadius: 3 }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Collapsible Detailed Report */}
                      {showReportDetails && (
                        <div
                          style={{
                            marginTop: 18,
                            paddingTop: 16,
                            borderTop: "1px dashed rgba(28,58,68,0.15)",
                            animation: "fadeIn 0.25s ease",
                          }}
                        >
                          <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: "#1C2F3A" }}>
                            Detailed Cognitive Performance Analysis
                          </h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, fontSize: 13 }}>
                            <div style={{ background: "#F4F8F8", padding: 14, borderRadius: 10 }}>
                              <strong style={{ color: "#1C2F3A", display: "block", marginBottom: 4 }}>Screening Signal</strong>
                              <p style={{ margin: 0, color: "#3D5563" }}>{detail.screening_signal || "Routine monitoring signal."}</p>
                            </div>
                            {detail.overall_attention && (
                              <div style={{ background: "#F4F8F8", padding: 14, borderRadius: 10 }}>
                                <strong style={{ color: "#1C2F3A", display: "block", marginBottom: 4 }}>Attentional Focus Indicator</strong>
                                <p style={{ margin: 0, color: "#3D5563" }}>
                                  {detail.overall_attention?.label || "Stable attention observed during recent trials."}
                                </p>
                              </div>
                            )}
                          </div>
                          <div style={{ marginTop: 12, fontSize: 11, color: "#5C7382", fontStyle: "italic" }}>
                            ℹ️ Note: This report informs the caregiver to select appropriate activities. It does not replace clinical evaluation by a medical doctor.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Success Notification */}
              {levelSuccessMsg && (
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1.5px solid #10B981",
                    borderRadius: 14,
                    padding: "14px 18px",
                    color: "#065F46",
                    fontSize: 14,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: "0 4px 14px rgba(16,185,129,0.12)",
                  }}
                >
                  <span style={{ fontSize: 20 }}>✓</span>
                  <span>{levelSuccessMsg}</span>
                </div>
              )}

              {/* 2. ACTIVITY SUPPORT ASSESSMENT SECTION */}
              {!hasAssessment ? (
                /* LOCKED STATE WHEN ASSESSMENT NOT DONE */
                <Card
                  title="Activity Support Assessment"
                  icon="🧠"
                  badge={{
                    text: "🔒 Locked",
                    style: { background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1" },
                  }}
                >
                  <div style={{ padding: "24px 20px", background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "#1C2F3A", margin: "0 0 8px" }}>
                      Activity Level Assignment Locked
                    </h4>
                    <p style={{ fontSize: 14, color: "#64748B", margin: 0, maxWidth: 520, marginInline: "auto", lineHeight: 1.5 }}>
                      The patient must complete the cognitive assessment before an activity support level can be assigned. Once {patientName} completes the assessment, this section will unlock to select appropriate activities.
                    </p>
                  </div>
                </Card>
              ) : detail.activity_level && !isReassessing ? (
                /* STATE: LEVEL ASSIGNED -> SHOW ASSIGNED COGNITIVE ACTIVITY PLAN */
                <Card
                  title="Cognitive Activity Plan"
                  icon="🧠"
                  badge={{
                    text: "✓ Activity Level Assigned",
                    style: {
                      background: "#ECFDF5",
                      color: "#065F46",
                      border: "1px solid #A7F3D0",
                    },
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 13, color: "#5C7382", marginBottom: 6 }}>
                        Current Assigned Level: <strong style={{ color: "#1C2F3A", fontSize: 15 }}>{currentLevelObj?.title}</strong>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 999,
                            background: currentLevelObj?.accentLight,
                            border: `1px solid ${currentLevelObj?.accentBorder}`,
                            color: currentLevelObj?.color,
                            fontSize: 13,
                            fontWeight: 800,
                          }}
                        >
                          {currentLevelObj?.badgeLabel}
                        </span>
                        <span style={{ fontSize: 13, color: "#64748B" }}>
                          Assessment: <strong style={{ color: "#059669" }}>✓ Completed ({assessmentScore}/100)</strong>
                        </span>
                      </div>
                      <p style={{ color: "#334155", fontSize: 13.5, margin: "10px 0 0", maxWidth: 640 }}>
                        These activities are currently active in <strong>{patientName}</strong>'s Brain Games section. The patient will only see and play these assigned games.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => {
                          const gamesEl = document.getElementById("caregiver-games-section");
                          if (gamesEl) gamesEl.scrollIntoView({ behavior: "smooth" });
                        }}
                        style={{
                          background: "#F8FAFC",
                          border: "1px solid #CBD5E1",
                          borderRadius: 10,
                          padding: "9px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1C2F3A",
                          cursor: "pointer",
                        }}
                      >
                        View Progress
                      </button>
                      <button
                        onClick={() => setIsReassessing(true)}
                        style={{
                          background: "#2A8F8A",
                          border: "none",
                          borderRadius: 10,
                          padding: "9px 18px",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#FFFFFF",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(42,143,138,0.25)",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span>⚙️</span> Change Activity Level
                      </button>
                    </div>
                  </div>

                  {/* Assigned Activities List */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: "#5C7382", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      Included Activities ({currentLevelObj?.games.length || 4} Assigned Games)
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      {(currentLevelObj?.games || []).map((game, gIdx) => (
                        <div
                          key={game.id || gIdx}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: 14,
                            padding: "14px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                          }}
                        >
                          <span style={{ fontSize: 24, flexShrink: 0 }}>{game.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ color: "#059669", fontWeight: 800, fontSize: 14 }}>✓</span>
                              <strong style={{ fontSize: 14, color: "#1C2F3A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {game.name}
                              </strong>
                            </div>
                            <div style={{ fontSize: 11, color: "#5C7382", marginTop: 2 }}>{game.subName || game.focus}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : (
                /* STATE: SELECT / REASSESS ACTIVITY SUPPORT LEVEL (3 LEVELS) */
                <Card
                  title="Activity Support Assessment"
                  icon="🧠"
                  badge={{
                    text: isReassessing ? "Reassessing Support Level" : "Requires Assignment",
                    style: {
                      background: "#FFFBEB",
                      color: "#92400E",
                      border: "1px solid #FDE68A",
                    },
                  }}
                >
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ color: "#334155", fontSize: 14, lineHeight: 1.5, margin: "0 0 8px" }}>
                      Based on {patientName}'s assessment results and observed abilities, select an appropriate activity-support level.
                    </p>
                    <div style={{ fontSize: 12, color: "#5C7382", background: "#F4F8F8", padding: "8px 14px", borderRadius: 8, display: "inline-block" }}>
                      ℹ️ <strong>Important:</strong> These are activity-support levels to calibrate guidance and stimulation. They do not constitute a medical diagnosis.
                    </div>
                  </div>

                  {/* 3 Level Selection Cards */}
                  <div style={{ display: "grid", gap: 14, marginBottom: 22 }}>
                    {[1, 2, 3].map(lvlNum => {
                      const opt = ACTIVITY_LEVELS[lvlNum];
                      const isSelected = selectedLevel === lvlNum;
                      return (
                        <div
                          key={lvlNum}
                          onClick={() => setSelectedLevel(lvlNum)}
                          style={{
                            border: isSelected ? `2px solid ${opt.color}` : "1.5px solid #E2E8F0",
                            background: isSelected ? opt.accentLight : "#FFFFFF",
                            borderRadius: 16,
                            padding: "18px 20px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: isSelected ? `0 4px 16px ${opt.color}25` : "0 2px 6px rgba(0,0,0,0.03)",
                            display: "flex",
                            gap: 16,
                            alignItems: "flex-start",
                          }}
                        >
                          {/* Radio Button */}
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              border: isSelected ? `6px solid ${opt.color}` : "2px solid #CBD5E1",
                              background: "#FFFFFF",
                              flexShrink: 0,
                              marginTop: 2,
                              transition: "all 0.2s ease",
                            }}
                          />

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  background: opt.accentLight,
                                  border: `1px solid ${opt.accentBorder}`,
                                  color: opt.color,
                                }}
                              >
                                {opt.badgeLabel}
                              </span>
                              <strong style={{ fontSize: 16, color: "#1C2F3A" }}>{opt.title}</strong>
                            </div>

                            <p style={{ color: "#334155", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 6px" }}>
                              <strong>Focus:</strong> {opt.focus}
                            </p>
                            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.4, margin: "0 0 10px" }}>
                              <strong>Recommended for:</strong> {opt.recommendedFor}
                            </p>

                            {/* Included Activities list */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11.5, color: "#5C7382", fontWeight: 700 }}>Included Activities:</span>
                              {opt.games.map((g, gi) => (
                                <span
                                  key={gi}
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: "#1C2F3A",
                                    background: "#FFFFFF",
                                    padding: "3px 9px",
                                    borderRadius: 6,
                                    border: "1px solid #E2E8F0",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <span style={{ color: "#059669" }}>✓</span> {g.icon} {g.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "flex-end" }}>
                    {detail.activity_level && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLevel(detail.activity_level);
                          setIsReassessing(false);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid #CBD5E1",
                          borderRadius: 10,
                          padding: "10px 18px",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#64748B",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleConfirmLevel}
                      disabled={levelSaving}
                      style={{
                        background: "#2A8F8A",
                        border: "none",
                        borderRadius: 10,
                        padding: "11px 24px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        cursor: levelSaving ? "default" : "pointer",
                        boxShadow: "0 6px 18px rgba(42,143,138,0.3)",
                        opacity: levelSaving ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {levelSaving ? "⏳ Saving..." : detail.activity_level ? "Confirm Activity Level →" : "Assign Activity Level →"}
                    </button>
                  </div>
                </Card>
              )}
            </div>

            {/* Longitudinal Trend + Care Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 24 }}>
              <Card
                title="Longitudinal Cognitive Trajectory (6-Week Composite Curve)"
                icon="📈"
                badge={{ text: "Weekly Assessments", style: { background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" } }}
                style={{ gridColumn: "span 2" }}
              >
                <p style={{ color: "#5C7382", fontSize: 13, marginTop: 0 }}>
                  Composite score progression across 6 weekly evaluations. Visualizes steady early drift before clinical symptoms are typically reported:
                </p>
                <LongitudinalTrendChart points={detail.performance_trend} />
              </Card>

              {/* Daily Care & Compliance */}
              <Card title="Daily Routine & Medication" icon="💊">
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#334155", fontSize: 13 }}>Scheduled Reminders</span>
                    <strong style={{ color: "#2A8F8A" }}>{detail.routine.length} Active</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#334155", fontSize: 13 }}>Hydration Intake</span>
                    <strong style={{ color: "#2563EB" }}>{detail.hydration_glasses} Glasses Logged</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                    <span style={{ color: "#334155", fontSize: 13 }}>Personal Memory Anchors</span>
                    <strong style={{ color: "#DB2777" }}>{detail.memory_bank.length} Familiar Items</strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Rhythm & Recall Music Engagement Analytics */}
            <div style={{ marginTop: 24 }}>
              <RhythmAnalytics patientId={detail.patient_id} />
            </div>

            {/* CAREGIVER MONITORING OF COGNITIVE ACTIVITIES SECTION */}
            <div id="caregiver-games-section" style={{ marginTop: 24 }}>
              <Card
                title="Cognitive Activity Monitoring"
                icon="🌾"
                badge={{
                  text: `${detail.game_activity?.length || 0} Sessions Played`,
                  style: { background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" },
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 18 }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Activities Assigned</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#1C2F3A", marginTop: 4 }}>
                      {currentLevelObj ? `${currentLevelObj.games.length} Games (${currentLevelObj.badgeLabel})` : "None Assigned"}
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Games Played</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#2A8F8A", marginTop: 2 }}>
                      {detail.game_activity?.length || 0} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}>sessions</span>
                    </div>
                  </div>

                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Recent Performance</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#2563EB", marginTop: 2 }}>
                      {detail.game_activity && detail.game_activity.length > 0
                        ? `${Math.round(detail.game_activity.reduce((acc, s) => acc + (s.score || 0), 0) / detail.game_activity.length)}%`
                        : "—"}
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#64748B" }}> avg</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1C2F3A" }}>Recent Game Sessions & Telemetry</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setIsReassessing(true)}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#2A8F8A",
                        cursor: "pointer",
                      }}
                    >
                      Reassess Activity Level
                    </button>
                  </div>
                </div>

                {detail.game_activity && detail.game_activity.length > 0 ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {[...detail.game_activity].reverse().slice(0, 5).map((sess, idx) => {
                      const isVillage = sess.game_id === "voice_village";
                      return (
                        <div
                          key={sess.session_id || idx}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            borderRadius: 14,
                            padding: "14px 18px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 12,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 18 }}>{isVillage ? "🌾" : "🎮"}</span>
                              <strong style={{ fontSize: 15, color: "#1C2F3A" }}>
                                {sess.game_title || (isVillage ? "Voice of the Village" : "Brain Game")}
                              </strong>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: "#5C7382",
                                  background: "#F1F5F9",
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                }}
                              >
                                {sess.domain_label || sess.cognitive_domain || "Cognitive Focus"}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>
                              {sess.timestamp ? new Date(sess.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                              {sess.duration_seconds ? ` · Duration: ${sess.duration_seconds}s` : ""}
                              {sess.telemetry?.replays_count ? ` · Replays: ${sess.telemetry.replays_count}` : ""}
                              {sess.telemetry?.response_latency_ms ? ` · Latency: ${sess.telemetry.response_latency_ms}ms` : ""}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 16, fontWeight: 900, color: "#2A8F8A" }}>
                                {Math.round(sess.score || 0)}%
                              </div>
                              <div style={{ fontSize: 11, color: "#F59E0B" }}>
                                {"⭐".repeat(sess.stars || 3)}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: "4px 10px",
                                borderRadius: 8,
                                background: "#F1F5F9",
                                border: "1px solid #E2E8F0",
                                fontSize: 12,
                                color: "#1C2F3A",
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              Level {sess.difficulty_level || 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#64748B", fontSize: 13, padding: "12px 0", textAlign: "center", background: "#F8FAFC", borderRadius: 10 }}>
                    No cognitive training sessions logged yet. Activities will appear here once {patientName} begins playing.
                  </div>
                )}

                <div style={{ fontSize: 11, color: "#64748B", marginTop: 14 }}>
                  Activity and engagement observation for clinical and care team review. Not a medical diagnosis.
                </div>
              </Card>
            </div>

            {/* ALERT DETAILS MODAL DIALOG */}
            {selectedAlert && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="alert-modal-title"
                onClick={() => setSelectedAlert(null)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 10001,
                  background: "rgba(28,47,58,0.45)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 20,
                }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: "100%",
                    maxWidth: 580,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 22,
                    padding: "28px 32px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    color: "#1C2F3A",
                    fontFamily: "'DM Sans', sans-serif",
                    maxHeight: "90vh",
                    overflowY: "auto",
                  }}
                >
                  {/* Modal Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(42,143,138,0.12)", border: "1px solid rgba(42,143,138,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        {selectedAlert.category_icon || "🔔"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, background: selectedAlert.severity === "high" ? "#FEE2E2" : "rgba(42,143,138,0.15)", color: selectedAlert.severity === "high" ? "#991B1B" : "#2A8F8A", padding: "2px 8px", borderRadius: 6 }}>
                            {selectedAlert.category_label || "Caregiver Alert"}
                          </span>
                          <span style={{ fontSize: 10.5, color: selectedAlert.status === "new" ? "#2A8F8A" : "#64748B", background: "#F1F5F9", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                            {selectedAlert.status === "new" ? "● Active Observation" : "✓ Marked Reviewed"}
                          </span>
                        </div>
                        <h2 id="alert-modal-title" style={{ fontSize: 19, fontWeight: 800, margin: 0, color: "#1C2F3A" }}>
                          {selectedAlert.title}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAlert(null)}
                      aria-label="Close alert details"
                      style={{ background: "#F1F5F9", border: "none", color: "#64748B", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Primary Message */}
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: "14px 16px", marginBottom: 18, fontSize: 13.5, color: "#334155", lineHeight: 1.6 }}>
                    {selectedAlert.message}
                  </div>

                  {/* Category Structured Details */}
                  {selectedAlert.category === "missed_medication" && (
                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, border: "1px solid #E2E8F0", marginBottom: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Scheduled Time</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#2A8F8A", marginTop: 2 }}>{selectedAlert.data?.scheduled_time || selectedAlert.due_time}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Status / Elapsed</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginTop: 2 }}>{selectedAlert.data?.status_note || `Not acknowledged for ${selectedAlert.delay_minutes} minutes`}</div>
                        </div>
                        {selectedAlert.data?.dosage && (
                          <div>
                            <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Dosage</div>
                            <div style={{ fontSize: 13, color: "#1C2F3A", marginTop: 2 }}>{selectedAlert.data.dosage}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Instructions</div>
                          <div style={{ fontSize: 13, color: "#334155", marginTop: 2 }}>{selectedAlert.data?.instructions || "Take with water."}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAlert.category === "performance_change" && (
                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, border: "1px solid #E2E8F0", marginBottom: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Previous Average</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#2563EB", marginTop: 2 }}>{selectedAlert.data?.previous_average}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Recent Average</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#D97706", marginTop: 2 }}>{selectedAlert.data?.recent_average}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Net Change</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#EF4444", marginTop: 2 }}>{selectedAlert.data?.percentage_change}%</div>
                        </div>
                      </div>
                      {selectedAlert.data?.recent_attempts?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Recent Attempt Sequence</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {selectedAlert.data.recent_attempts.map((sc, i) => (
                              <span key={i} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#1C2F3A" }}>
                                Attempt {i + 1}: {sc}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAlert.category === "unusual_inactivity" && (
                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, border: "1px solid #E2E8F0", marginBottom: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Inactivity Duration</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#EF4444", marginTop: 2 }}>{selectedAlert.data?.days_inactive} Days</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Last Active Record</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#1C2F3A", marginTop: 2 }}>{selectedAlert.data?.last_active_date || "None logged"}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedAlert.category === "repeated_difficulty" && (
                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, border: "1px solid #E2E8F0", marginBottom: 18 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Cognitive Game</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#1C2F3A", marginTop: 2 }}>{selectedAlert.data?.game_title}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase" }}>Current Level Pacing</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#2A8F8A", marginTop: 2 }}>{selectedAlert.data?.current_difficulty}</div>
                        </div>
                      </div>
                      {selectedAlert.data?.recent_attempts?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Recent Low Attempts</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {selectedAlert.data.recent_attempts.map((sc, i) => (
                              <span key={i} style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#991B1B" }}>
                                Attempt {i + 1}: {sc}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedAlert.category === "missed_routine" && (
                    <div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, border: "1px solid #E2E8F0", marginBottom: 18 }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Completed Routine Items</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {selectedAlert.data?.completed_items?.length > 0 ? (
                            selectedAlert.data.completed_items.map((item, idx) => (
                              <span key={idx} style={{ fontSize: 12, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 6, padding: "3px 8px" }}>
                                ✓ {item}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: "#64748B" }}>None completed yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>Pending Items Due</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {selectedAlert.data?.incomplete_items?.map((item, idx) => (
                            <span key={idx} style={{ fontSize: 12, color: "#991B1B", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 6, padding: "3px 8px" }}>
                              ✗ {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Caregiver Action */}
                  <div style={{ background: "rgba(42,143,138,0.08)", border: "1px solid rgba(42,143,138,0.25)", borderRadius: 14, padding: "14px 18px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>💡</span>
                      <strong style={{ fontSize: 13, color: "#2A8F8A", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Recommended Action
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                      {selectedAlert.recommended_action}
                    </p>
                  </div>

                  {/* Non-diagnostic Statutory Notice */}
                  <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, marginBottom: 20 }}>
                    {selectedAlert.disclaimer || "Activity and performance observation for caregiver review. Not a medical diagnosis."}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={() => handleToggleReview(selectedAlert)}
                      disabled={alertActionLoading === selectedAlert.id}
                      style={{
                        background: selectedAlert.status === "reviewed" ? "#F1F5F9" : "#2A8F8A",
                        color: selectedAlert.status === "reviewed" ? "#1C2F3A" : "#FFFFFF",
                        border: selectedAlert.status === "reviewed" ? "1px solid #CBD5E1" : "none",
                        borderRadius: 12,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {selectedAlert.status === "reviewed" ? "↩ Reopen Alert" : "✓ Mark as Reviewed"}
                    </button>
                    <button
                      onClick={() => setSelectedAlert(null)}
                      style={{
                        background: "transparent",
                        color: "#64748B",
                        border: "1px solid #CBD5E1",
                        borderRadius: 12,
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </main>
  );
}
