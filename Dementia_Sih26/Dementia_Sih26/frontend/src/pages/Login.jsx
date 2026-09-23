import { useState } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn, Stars } from "../components/RiskDashboard";
import { login, register } from "../services/api";
import LanguageSelector from "../components/common/LanguageSelector";

const LIME = "#2A8F8A";

export default function LoginPage({ setView, setRole, setCurrentUser, onAuthSuccess, onStartSihDemo }) {
  const [mode, setMode]     = useState("user");   // "user" | "caregiver" | "doctor"
  const [tab, setTab]       = useState("login");  // "login" | "register"
  const [step, setStep]     = useState(1);        // doctor register: step 1 or 2
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");

  // Doctor-specific fields
  const [license,       setLicense]       = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital,      setHospital]      = useState("");
  const [location,      setLocation]      = useState("");
  const [yearsExp,      setYearsExp]      = useState("");
  const [consultMode,   setConsultMode]   = useState("Both");
  const [bio,           setBio]           = useState("");

  // Patient-specific
  const [age, setAge] = useState("");

  const backendRole = mode === "doctor" ? "doctor" : mode === "caregiver" ? "caregiver" : "patient";
  const isDoctorRegister = mode === "doctor" && tab === "register";

  async function handleSubmit() {
    setError("");

    if (!email.trim() || !password.trim()) return setError("Email and password are required.");
    const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRe.test(email.trim())) return setError("Please enter a valid email address.");

    if (tab === "register") {
      if (!fullName.trim()) return setError("Full name is required.");
      if (password.length < 6) return setError("Password must be at least 6 characters.");

      if (mode === "doctor") {
        if (step === 1) {
          if (!license.trim()) return setError("Medical license number is required.");
          if (!specialization) return setError("Please select a specialization.");
          setStep(2);
          return;
        }
        // step 2 - hospital, location, bio
        if (!hospital.trim()) return setError("Hospital / clinic name is required.");
      }
    }

    setLoading(true);
    try {
      let result;
      if (tab === "login") {
        result = await login(email.trim(), password, backendRole);
      } else {
        result = await register({
          full_name:      fullName.trim(),
          email:          email.trim(),
          password,
          role:           backendRole,
          age:            age ? parseInt(age) : undefined,
          license_number: license.trim() || undefined,
          specialization: specialization || undefined,
          hospital:       hospital.trim() || undefined,
          location:       location.trim() || undefined,
          years_experience: yearsExp ? parseInt(yearsExp) : undefined,
          consultation_mode: consultMode || undefined,
          bio:            bio.trim() || undefined,
          max_patients:   10,
        });
      }

      if (onAuthSuccess) {
        onAuthSuccess(result.user, backendRole, tab === "register");
      } else {
        if (setCurrentUser) setCurrentUser(result.user);
        setRole(mode);
        setView(mode === "doctor" ? "doctor-dashboard" : mode === "caregiver" ? "caregiver-dashboard" : "dashboard");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode); setError(""); setStep(1);
    setFullName(""); setEmail(""); setPassword(""); setLicense(""); setAge("");
    setSpecialization(""); setHospital(""); setLocation(""); setYearsExp(""); setBio("");
  }

  function switchTab(newTab) { setTab(newTab); setError(""); setStep(1); }

  const inputStyle = { padding: "14px 16px", borderRadius: 12, fontSize: 18, fontFamily: "'Source Sans 3','DM Sans',sans-serif", width: "100%", background: "#FFFFFF", color: T.cream, border: "1.5px solid rgba(28,58,68,0.18)" };
  const selectStyle = { ...inputStyle, cursor: "pointer", colorScheme: "light", outline: "none" };
  const labelStyle = { fontSize: 16, color: T.creamDim, marginBottom: 6, display: "block", fontWeight: 600 };

  const SPECIALIZATIONS = ["Neurology","Psychiatry","Geriatrics","Neuropsychology","Internal Medicine","General Practice","Other"];
  const CONSULT_MODES   = ["Online","Offline","Both"];

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(42,143,138,0.14) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(107,99,165,0.10) 0%, transparent 55%), ${T.bg}`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Source Sans 3','DM Sans',sans-serif", position: "relative", overflow: "hidden" }}>
      <Stars count={60} />

      <div style={{ position: "fixed", top: 20, right: 24, zIndex: 10 }}>
        <LanguageSelector />
      </div>

      <div style={{ width: "100%", maxWidth: isDoctorRegister ? 500 : 420, position: "relative", zIndex: 2 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#2A8F8A,#1F716D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px", color: "#fff", fontWeight: 800 }}>N</div>
          <div style={{ fontFamily: "'Source Serif 4',serif", fontSize: 32, color: T.cream }}>NeuroAid</div>
          <div style={{ color: T.creamFaint, fontSize: 18, marginTop: 4 }}>Cognitive care, made simple</div>
        </div>

        <DarkCard style={{ padding: 32 }} hover={false}>

          {/* SIH Demo Direct Launch Banner */}
          <div style={{ marginBottom: 22, background: "linear-gradient(135deg, rgba(42,143,138,0.14), rgba(42,143,138,0.06))", border: "1px solid rgba(42,143,138,0.35)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#2A8F8A", textTransform: "uppercase", letterSpacing: 0.8 }}>
                SIH 2026 Judge Evaluation
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2F3A", marginTop: 2 }}>
                Deterministic 4-Min Experience
              </div>
            </div>
            <button
              type="button"
              onClick={onStartSihDemo}
              style={{
                background: "#2A8F8A",
                color: "#000",
                border: "none",
                borderRadius: 10,
                padding: "9px 15px",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(42,143,138,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>⚡</span> Launch Demo
            </button>
          </div>

          {/* Role switcher */}
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 50, padding: 4, marginBottom: 24, border: "1px solid rgba(28,58,68,0.11)" }}>
            {[{ key: "user", label: "👤 Patient" }, { key: "caregiver", label: "👥 Caregiver" }, { key: "doctor", label: "🩺 Doctor" }].map(r => (
              <button key={r.key} onClick={() => switchMode(r.key)} style={{ flex: 1, padding: "12px 0", borderRadius: 50, border: "none", background: mode === r.key ? "#2A8F8A" : "transparent", color: mode === r.key ? "#FFFFFF" : T.creamFaint, fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Source Sans 3','DM Sans',sans-serif", transition: "all 0.2s" }}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Role hint */}
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "9px 14px", marginBottom: 20, fontSize: 12, color: T.creamFaint, border: "1px solid rgba(28,58,68,0.10)", textAlign: "center" }}>
            {mode === "doctor"
              ? "🩺 Doctor accounts supervise patients and view neural pattern analytics"
              : mode === "caregiver"
              ? "👥 Caregiver accounts support patients, monitor daily activity, and manage care routines"
              : "👤 Patient accounts take cognitive assessments and track progress"}
          </div>

          {/* Login / Register tabs */}
          <div style={{ display: "flex", marginBottom: 22, borderBottom: "1px solid rgba(28,58,68,0.10)" }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => switchTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", background: "transparent", color: tab === t ? T.cream : T.creamFaint, fontWeight: tab === t ? 700 : 400, fontSize: 18, cursor: "pointer", fontFamily: "'Source Sans 3','DM Sans',sans-serif", borderBottom: tab === t ? `3px solid #2A8F8A` : "3px solid transparent", marginBottom: -1, transition: "all 0.2s", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>

          {/* ── Doctor Register: Step indicator ── */}
          {isDoctorRegister && (
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {["Account Details", "Clinic Info"].map((label, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ height: 3, borderRadius: 2, background: i < step ? T.red : "rgba(28,58,68,0.11)", marginBottom: 4 }} />
                  <div style={{ fontSize: 10, color: i < step ? T.red : "rgba(255,255,255,0.25)", fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ── Shared: Name, Email, Password ── */}
            {(!isDoctorRegister || step === 1) && tab === "register" && (
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input placeholder="Dr. Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} className="glass-input" style={inputStyle} />
              </div>
            )}

            {(!isDoctorRegister || step === 1) && (
              <>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="glass-input" style={inputStyle} autoComplete="email" />
                </div>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" placeholder={tab === "login" ? "Enter password" : "Min. 6 characters"} value={password} onChange={e => setPassword(e.target.value)} className="glass-input" style={inputStyle} autoComplete={tab === "login" ? "current-password" : "new-password"} />
                </div>
              </>
            )}

            {/* ── Patient register extras ── */}
            {tab === "register" && mode === "user" && (
              <div>
                <label style={labelStyle}>Age (optional)</label>
                <input type="number" placeholder="e.g. 45" value={age} onChange={e => setAge(e.target.value)} className="glass-input" style={inputStyle} />
              </div>
            )}

            {/* ── Doctor Register: Step 1 ── */}
            {isDoctorRegister && step === 1 && (
              <>
                <div>
                  <label style={labelStyle}>Medical License Number *</label>
                  <input placeholder="e.g. MCI-123456" value={license} onChange={e => setLicense(e.target.value)} className="glass-input" style={inputStyle} autoComplete="off" />
                </div>
                <div>
                  <label style={labelStyle}>Specialization *</label>
                  <select value={specialization} onChange={e => setSpecialization(e.target.value)} style={selectStyle}>
                    <option value="" style={{ background: "#FFFFFF" }}>Select specialization…</option>
                    {SPECIALIZATIONS.map(s => <option key={s} value={s} style={{ background: "#FFFFFF" }}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Years of Experience</label>
                  <input type="number" min="0" max="60" placeholder="e.g. 12" value={yearsExp} onChange={e => setYearsExp(e.target.value)} className="glass-input" style={inputStyle} />
                </div>
              </>
            )}

            {/* ── Doctor Register: Step 2 ── */}
            {isDoctorRegister && step === 2 && (
              <>
                <div>
                  <label style={labelStyle}>Hospital / Clinic Name *</label>
                  <input placeholder="e.g. Apollo Hospitals, Delhi" value={hospital} onChange={e => setHospital(e.target.value)} className="glass-input" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Location (City)</label>
                  <input placeholder="e.g. Mumbai, India" value={location} onChange={e => setLocation(e.target.value)} className="glass-input" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Consultation Mode</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {CONSULT_MODES.map(m => (
                      <button key={m} onClick={() => setConsultMode(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${consultMode === m ? T.red : "rgba(28,58,68,0.15)"}`, background: consultMode === m ? "rgba(232,64,64,0.15)" : "transparent", color: consultMode === m ? T.red : T.creamFaint, fontSize: 13, fontWeight: consultMode === m ? 700 : 400, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}>{m}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Short Bio (optional)</label>
                  <textarea placeholder="Brief description of your practice and expertise…" value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, background: "#FFFFFF", border: "1px solid rgba(28,58,68,0.13)", resize: "none", lineHeight: 1.5 }} />
                </div>
                <div style={{ background: "rgba(42,143,138,0.06)", border: `1px solid ${LIME}22`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: LIME }}>
                  ✓ Max patients is fixed at 10 per doctor. Patients can request enrollment from their dashboard.
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{ color: "#ff6b6b", fontSize: 13, textAlign: "center", padding: "10px 14px", background: "rgba(232,64,64,0.10)", borderRadius: 10, border: "1px solid rgba(232,64,64,0.25)", lineHeight: 1.5 }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Doctor Step 2: Back button ── */}
            {isDoctorRegister && step === 2 && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: `1px solid ${T.cardBorder}`, background: "transparent", color: T.creamFaint, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
                <Btn onClick={handleSubmit} disabled={loading} style={{ flex: 2, justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Creating account…" : "Register as Doctor →"}
                </Btn>
              </div>
            )}

            {!(isDoctorRegister && step === 2) && (
              <Btn onClick={handleSubmit} disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 2, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Please wait…"
                  : isDoctorRegister && step === 1 ? "Next: Clinic Info →"
                  : tab === "login" ? `Sign In as ${mode === "doctor" ? "Doctor" : mode === "caregiver" ? "Caregiver" : "Patient"} →`
                  : "Create Account →"}
              </Btn>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={() => setView("landing")} style={{ background: "none", border: "none", color: T.creamFaint, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back to Home</button>
          </div>
        </DarkCard>
      </div>
    </div>
  );
}
