import { useState, useEffect } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn, MiniChart } from "../components/RiskDashboard";
import { getPatients, getUser, connectCaregiverByEmail, getDoctorCaregivers, getPendingRequests, approvePatient } from "../services/api";

const LIME = "#2A8F8A";

function riskColor(level) {
  return level === "High" ? T.red : level === "Moderate" ? T.amber : level === "Low" ? T.green : "#444";
}

function topRisk(p) {
  const r = p.lastResult;
  if (!r) return null;
  const levels = [r.risk_levels?.alzheimers, r.risk_levels?.dementia, r.risk_levels?.parkinsons];
  if (levels.includes("High"))     return "High";
  if (levels.includes("Moderate")) return "Moderate";
  return "Low";
}

export default function DoctorHome({ setPage, setSelectedPatient }) {
  const [patients,         setPatients]         = useState([]);
  const [pendingRequests,  setPendingRequests]  = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [actionLoading,    setActionLoading]    = useState(null);
  const [actionMsg,        setActionMsg]        = useState(null);
  // Caregiver connection state
  const [caregivers,          setCaregivers]          = useState([]);
  const [pendingCaregivers,   setPendingCaregivers]   = useState([]);
  const [isConnectingCG,      setIsConnectingCG]      = useState(false);
  const [cgEmail,             setCgEmail]             = useState("");
  const [cgConnectLoading,    setCgConnectLoading]    = useState(false);
  const [cgConnectError,      setCgConnectError]      = useState("");
  const [cgConnectSuccess,    setCgConnectSuccess]    = useState("");
  const doctor = getUser();

  async function loadData() {
    try {
      const [list, pendingData] = await Promise.all([
        getPatients(),
        getPendingRequests()
          .then(reqs => ({ pending_requests: reqs || [] }))
          .catch(() => ({ pending_requests: [] })),
      ]);
      setPatients(list || []);
      setPendingRequests(pendingData.pending_requests || []);
      // Load caregiver connections
      getDoctorCaregivers()
        .then(data => {
          setCaregivers(data.connected_caregivers || []);
          setPendingCaregivers(data.pending_requests || []);
        })
        .catch(() => {});
    } catch (e) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(patientId, action) {
    setActionLoading(patientId + action);
    setActionMsg(null);
    try {
      const data = await approvePatient(patientId, action);
      setActionMsg(data.message);
      await loadData();
    } catch (e) {
      setActionMsg("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => { loadData(); }, []);

  const withResults = patients.filter(p => p.lastResult);
  const highRisk    = patients.filter(p => topRisk(p) === "High");
  const modRisk     = patients.filter(p => topRisk(p) === "Moderate");
  const noTest      = patients.filter(p => !p.lastResult);

  // Averages across all patients who have results
  const avg = (key) => withResults.length === 0 ? 0
    : Math.round(withResults.reduce((s, p) => s + (p.lastResult[key] || 0) * 100, 0) / withResults.length);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `rgba(42,143,138,0.10)`, border: `1px solid ${LIME}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 14, fontSize: 11, fontWeight: 700, color: LIME, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: LIME, display: "inline-block" }} />
          Clinical Overview
        </div>
        <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: "clamp(28px,3.5vw,44px)", color: "#1C2F3A", letterSpacing: "-1.5px", lineHeight: 1.1, marginBottom: 8 }}>
          Welcome, Dr. <span style={{ color: LIME }}>{doctor?.full_name?.split(" ")[0] || "Doctor"}.</span>
        </h1>
        <p style={{ color: "#555", fontSize: 14 }}>
          {patients.length} registered patient{patients.length !== 1 ? "s" : ""} · {withResults.length} with assessment data
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#555", fontSize: 14, padding: 40, textAlign: "center" }}>Loading…</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total Patients",   val: patients.length,     icon: "👥", c: T.cream  },
              { label: "Caregivers",        val: caregivers.length,   icon: "🤝", c: "#2A8F8A" },
              { label: "⚠️ High Risk",     val: highRisk.length,     icon: "●",  c: T.red    },
              { label: "Moderate Risk",    val: modRisk.length,      icon: "●",  c: T.amber   },
              { label: "Pending Test",     val: noTest.length,       icon: "⏳", c: "#555"   },
            ].map(s => (
              <DarkCard key={s.label} style={{ padding: 22 }}>
                <div style={{ fontSize: 18, color: s.c, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 40, color: s.c === T.cream ? "#fff" : s.c, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: T.creamFaint, marginTop: 6 }}>{s.label}</div>
              </DarkCard>
            ))}
          </div>

          {/* ── Caregivers Section ── */}
          <DarkCard style={{ padding: 24, marginBottom: 20, background: "#FFFFFF", border: "1px solid rgba(42,143,138,0.20)", boxShadow: "0 4px 20px rgba(28,47,58,0.06)" }} hover={false}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1C2F3A", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤝</span> Caregivers
                {pendingCaregivers.length > 0 && (
                  <span style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                    {pendingCaregivers.length} pending
                  </span>
                )}
              </h3>
              <button
                onClick={() => { setIsConnectingCG(true); setCgEmail(""); setCgConnectError(""); setCgConnectSuccess(""); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2A8F8A", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(42,143,138,0.25)", fontFamily: "'DM Sans',sans-serif" }}
              >
                <span style={{ fontSize: 16 }}>+</span> Connect Caregiver
              </button>
            </div>

            {/* Pending sent caregiver requests */}
            {pendingCaregivers.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#D97706", letterSpacing: 0.8, marginBottom: 10 }}>⏳ Awaiting Caregiver Response</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pendingCaregivers.map(req => (
                    <div key={req.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#92400E", fontSize: 15, flexShrink: 0 }}>
                        {(req.caregiver_name?.[0] || "C").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 14 }}>{req.caregiver_name || "Caregiver"}</div>
                        <div style={{ fontSize: 12, color: "#5C7382", marginTop: 1 }}>{req.caregiver_email || ""}</div>
                      </div>
                      <span style={{ background: "rgba(245,158,11,0.12)", color: "#D97706", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>⏳ Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected caregivers */}
            {caregivers.length > 0 ? (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#2A8F8A", letterSpacing: 0.8, marginBottom: 10 }}>✓ Connected Caregivers</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {caregivers.map(cg => (
                    <div key={cg.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(42,143,138,0.05)", border: "1.5px solid rgba(42,143,138,0.18)" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(42,143,138,0.14)", color: "#2A8F8A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                        {(cg.caregiver_name?.[0] || "C").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 14 }}>{cg.caregiver_name || "Caregiver"}</div>
                        <div style={{ fontSize: 12, color: "#5C7382", marginTop: 1 }}>{cg.caregiver_email || ""}</div>
                      </div>
                      <span style={{ background: "rgba(42,143,138,0.10)", color: "#2A8F8A", border: "1px solid rgba(42,143,138,0.22)", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                        {cg.patient_count > 0 ? `${cg.patient_count} patient${cg.patient_count > 1 ? "s" : ""}` : "0 patients"} · ✓ Connected
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : pendingCaregivers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#5C7382" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🤝</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1C2F3A", marginBottom: 4 }}>No caregivers connected yet</div>
                <div style={{ fontSize: 13 }}>Click "+ Connect Caregiver" to send a request.</div>
              </div>
            ) : null}
          </DarkCard>

          {/* Connect Caregiver Modal */}
          {isConnectingCG && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={() => setIsConnectingCG(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            >
              <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "32px 30px", maxWidth: 460, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.16)", border: "1px solid rgba(42,143,138,0.2)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1C2F3A" }}>Connect a Caregiver</h2>
                  <button onClick={() => setIsConnectingCG(false)} style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer" }}>✕</button>
                </div>
                <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
                  Enter the caregiver's registered NeuroAid email. They will receive a connection request and must accept it from their portal.
                </p>

                {cgConnectError && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{cgConnectError}</div>}
                {cgConnectSuccess && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #86EFAC", color: "#15803D", fontSize: 13, marginBottom: 14 }}>✓ {cgConnectSuccess}</div>}

                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!cgEmail.trim()) return;
                  setCgConnectLoading(true);
                  setCgConnectError("");
                  setCgConnectSuccess("");
                  try {
                    const res = await connectCaregiverByEmail(cgEmail);
                    setCgConnectSuccess(res.message || "Connection request sent!");
                    setPendingCaregivers(prev => [...prev, res.relationship]);
                    setTimeout(() => { setIsConnectingCG(false); setCgConnectSuccess(""); setCgEmail(""); }, 2000);
                  } catch (err) {
                    setCgConnectError(err.message || "Failed to send request. Please check the email and try again.");
                  } finally {
                    setCgConnectLoading(false);
                  }
                }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Caregiver's Email Address</label>
                  <input
                    type="email"
                    value={cgEmail}
                    onChange={e => setCgEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    required
                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #CBD5E1", fontSize: 14, outline: "none", fontFamily: "'DM Sans',sans-serif", color: "#1C2F3A", marginBottom: 16 }}
                  />
                  <button
                    type="submit"
                    disabled={cgConnectLoading || !cgEmail.trim()}
                    style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: cgConnectLoading ? "#93C5FD" : "#2A8F8A", color: "#FFFFFF", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 14px rgba(42,143,138,0.28)" }}
                  >
                    {cgConnectLoading ? "Sending…" : "Send Connection Request →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Pending Enrollment Requests ── */}
          {pendingRequests.length > 0 && (
            <DarkCard style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(245,158,11,0.25)" }} hover={false}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: T.amber, fontSize: 14 }}>
                  ⏳ Pending Enrollment Requests ({pendingRequests.length})
                </div>
              </div>
              {actionMsg && (
                <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: T.green, fontSize: 13 }}>
                  ✓ {actionMsg}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingRequests.map(req => (
                  <div key={req.patient_id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: T.cream, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(req.patient_name?.[0] || "?").toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: T.cream, fontSize: 14 }}>{req.patient_name}</div>
                      <div style={{ fontSize: 12, color: T.creamFaint }}>{req.patient_email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleApproval(req.patient_id, "approve")}
                        disabled={!!actionLoading}
                        style={{ padding: "7px 16px", borderRadius: 20, border: "none", background: T.green, color: "#F6F3ED", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: actionLoading === req.patient_id + "approve" ? 0.6 : 1 }}
                      >
                        {actionLoading === req.patient_id + "approve" ? "…" : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => handleApproval(req.patient_id, "reject")}
                        disabled={!!actionLoading}
                        style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid rgba(232,64,64,0.3)", background: "transparent", color: T.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: actionLoading === req.patient_id + "reject" ? 0.6 : 1 }}
                      >
                        {actionLoading === req.patient_id + "reject" ? "…" : "✕ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </DarkCard>
          )}

          {/* Average neural pattern anomaly scores across all patients */}
          {withResults.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { key: "alzheimers_risk", label: "Avg. Memory Deviation Index", color: "#a78bfa" },
                { key: "dementia_risk",   label: "Avg. Executive Drift Score",  color: T.amber   },
                { key: "parkinsons_risk", label: "Avg. Motor Anomaly Index",    color: T.blue    },
              ].map(d => {
                const pct = avg(d.key);
                return (
                  <DarkCard key={d.key} style={{ padding: 22, border: `1px solid ${d.color}20` }}>
                    <div style={{ fontSize: 11, color: T.creamFaint, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{d.label}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 44, color: d.color, lineHeight: 1, marginBottom: 10 }}>
                      {pct}<span style={{ fontSize: 16, color: "#555" }}>%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(28,58,68,0.10)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: d.color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>across {withResults.length} assessed patient{withResults.length !== 1 ? "s" : ""}</div>
                  </DarkCard>
                );
              })}
            </div>
          )}

          {/* High risk patients — urgent attention */}
          {highRisk.length > 0 && (
            <DarkCard style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.red}25` }} hover={false}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: T.red, fontSize: 14 }}>⚠️ High Risk Patients — Needs Attention</div>
                <Btn small onClick={() => setPage("patients")}>View All →</Btn>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {highRisk.map(p => {
                  const last = p.lastResult;
                  return (
                    <div key={p.id} onClick={() => { setSelectedPatient(p); setPage("patient-detail"); }}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: "rgba(232,64,64,0.06)", border: "1px solid rgba(232,64,64,0.15)", cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${T.red}18`, border: `1px solid ${T.red}44`, display: "flex", alignItems: "center", justifyContent: "center", color: T.cream, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(p.full_name?.[0] || "?").toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: T.cream, fontSize: 14 }}>{p.full_name}</div>
                        <div style={{ fontSize: 12, color: T.creamFaint }}>{p.email}</div>
                      </div>
                      {last && (
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.creamFaint }}>
                          <span>Mem: <strong style={{ color: "#a78bfa" }}>{Math.round((last.alzheimers_risk || 0) * 100)}%</strong></span>
                          <span>Exec: <strong style={{ color: T.amber }}>{Math.round((last.dementia_risk || 0) * 100)}%</strong></span>
                          <span>Motor: <strong style={{ color: T.blue }}>{Math.round((last.parkinsons_risk || 0) * 100)}%</strong></span>
                        </div>
                      )}
                      <span style={{ color: T.red, fontSize: 13, fontWeight: 700 }}>View →</span>
                    </div>
                  );
                })}
              </div>
            </DarkCard>
          )}

          {/* Patients awaiting first test */}
          {noTest.length > 0 && (
            <DarkCard style={{ padding: 24, border: "1px solid rgba(28,58,68,0.10)" }} hover={false}>
              <div style={{ fontWeight: 700, color: T.creamFaint, fontSize: 14, marginBottom: 14 }}>⏳ Awaiting First Assessment</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {noTest.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(28,58,68,0.11)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(28,58,68,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontWeight: 700, fontSize: 12 }}>
                      {(p.full_name?.[0] || "?").toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: T.creamFaint }}>{p.full_name}</span>
                  </div>
                ))}
              </div>
            </DarkCard>
          )}

          {patients.length === 0 && (
            <DarkCard style={{ padding: 56, textAlign: "center" }} hover={false}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>👥</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 900, fontSize: 22, color: "#1C2F3A", marginBottom: 10 }}>No patients yet</div>
              <p style={{ color: "#555", fontSize: 14, maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>
                Share the NeuroAid app with your patients so they can register and complete cognitive assessments.
              </p>
            </DarkCard>
          )}
        </>
      )}
    </div>
  );
}