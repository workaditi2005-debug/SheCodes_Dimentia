import { useState } from "react";
import { T } from "../utils/theme";
import { DarkCard, Btn } from "../components/RiskDashboard";
import { useAssessment } from "../context/AssessmentContext";
import { submitAnalysis } from "../services/api";

const LIME = "#2A8F8A";

export default function AssessmentHub({ setPage }) {
  const {
    speechData, memoryData, reactionData, stroopData, tapData,
    setApiResult, setLoading, setError, loading, error, completedCount,
  } = useAssessment();

  const tests = [
    { id:"speech",   icon:"🎙️", title:"Speech Analysis",  desc:"Passage reading — WPM, pauses, rhythm variability.",    dur:"~2 min", accent:LIME,      done:!!speechData   },
    { id:"memory",   icon:"🧠", title:"Memory Test",       desc:"Recall + delayed recall. Latency, order, intrusions.",  dur:"~3 min", accent:"#60a5fa", done:!!memoryData   },
    { id:"reaction", icon:"⚡", title:"Reaction Time",     desc:"Speed, drift, misses. Sustained attention signal.",     dur:"~2 min", accent:"#f59e0b", done:!!reactionData },
    { id:"stroop",   icon:"🎨", title:"Stroop Test",       desc:"Color-word interference. Executive function signal.",   dur:"~2 min", accent:"#a78bfa", done:!!stroopData   },
    { id:"tap",      icon:"🥁", title:"Motor Tap Test",    desc:"10-second rapid tapping. Rhythmic motor control.",      dur:"~1 min", accent:"#fb923c", done:!!tapData      },
  ];

  async function handleSubmit() {
    setLoading(true); setError(null);
    try {
      const payload = {
        speech_audio: speechData?.audio_b64 || null,
        memory_results: {
          word_recall_accuracy: memoryData?.word_recall_accuracy ?? 50,
          pattern_accuracy:     memoryData?.pattern_accuracy     ?? 50,
        },
        reaction_times: reactionData?.times ?? [],
        speech:   speechData  ? { wpm:speechData.wpm, speed_deviation:speechData.speed_deviation, speech_speed_variability:speechData.speech_speed_variability, pause_ratio:speechData.pause_ratio, completion_ratio:speechData.completion_ratio, restart_count:speechData.restart_count, speech_start_delay:speechData.speech_start_delay } : null,
        memory:   memoryData  ? { word_recall_accuracy:memoryData.word_recall_accuracy, pattern_accuracy:memoryData.pattern_accuracy, delayed_recall_accuracy:memoryData.delayed_recall_accuracy, recall_latency_seconds:memoryData.recall_latency_seconds, order_match_ratio:memoryData.order_match_ratio, intrusion_count:memoryData.intrusion_count } : null,
        reaction: reactionData? { times:reactionData.times, miss_count:reactionData.miss_count, initiation_delay:reactionData.initiation_delay ?? null } : null,
        stroop:   stroopData  ? { total_trials:stroopData.total_trials, error_count:stroopData.error_count, mean_rt:stroopData.mean_rt, incongruent_rt:stroopData.incongruent_rt } : null,
        tap:      tapData     ? { intervals:tapData.intervals, tap_count:tapData.tap_count } : null,
      };
      const result = await submitAnalysis(payload);
      setApiResult(result);
      setPage("results");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const allDone = completedCount >= 5;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:`rgba(42,143,138,0.10)`, border:`1px solid ${LIME}33`, borderRadius:99, padding:"5px 14px", marginBottom:14, fontSize:11, fontWeight:700, color:LIME, letterSpacing:1.5, textTransform:"uppercase" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:LIME, display:"inline-block", animation:"pulse-dot 2s infinite" }} />
          Cognitive Assessment
        </div>
        <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:900, fontSize:"clamp(28px,3.5vw,48px)", color:"#1C2F3A", letterSpacing:"-1.5px", lineHeight:1.1, marginBottom:8 }}>
          Assessment <span style={{ color:LIME }}>Hub.</span>
        </h1>
        <p style={{ color:"#555", fontSize:14, fontWeight:500 }}>
          Complete all 5 tests to generate your neural pattern analysis and cognitive domain performance scores.
        </p>
      </div>

      {/* ── Progress card ── */}
      <DarkCard style={{ padding:24, marginBottom:24 }} hover={false}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontSize:13, color:"#888", fontWeight:700, letterSpacing:0.5 }}>Session Progress</span>
          <span style={{ fontSize:13, fontWeight:900, color:completedCount===5 ? LIME : "#fff" }}>
            {completedCount} <span style={{ color:"#444", fontWeight:400 }}>/ 5</span>
          </span>
        </div>
        <div style={{ height:4, borderRadius:2, background:"rgba(28,58,68,0.10)", overflow:"hidden" }}>
          <div style={{
            height:"100%",
            width:`${(completedCount/5)*100}%`,
            background:`linear-gradient(90deg,${LIME},#1F716D)`,
            borderRadius:2, transition:"width 0.6s ease",
            boxShadow:`0 0 12px ${LIME}55`,
          }} />
        </div>
        {completedCount === 5 && (
          <div style={{ marginTop:10, fontSize:12, color:LIME, fontWeight:700, letterSpacing:0.5 }}>
            ✓ All tests complete — ready to submit
          </div>
        )}
      </DarkCard>

      {/* ── Test grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:16 }}>
        {tests.slice(0,3).map(t => <TestCard key={t.id} t={t} setPage={setPage} loading={loading} />)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
        {tests.slice(3).map(t => <TestCard key={t.id} t={t} setPage={setPage} loading={loading} />)}
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:14, padding:"16px 20px", marginBottom:20, display:"flex", gap:12, alignItems:"flex-start", boxShadow:"0 4px 14px rgba(220,38,38,0.06)" }}>
        <span style={{ fontSize:18, color:"#DC2626", flexShrink:0 }}>⚠️</span>
        <p style={{ color:"#991B1B", fontSize:13.5, lineHeight:1.65, fontWeight:500, margin:0 }}>
          <strong style={{ fontWeight:800 }}>Screening tool only.</strong> NOT a medical diagnosis. Always consult a qualified neurologist for clinical evaluation.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:12, padding:"14px 18px", marginBottom:16, color:"#991B1B", fontSize:13.5, fontWeight:700, display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ color:"#DC2626", fontSize:18 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <Btn
        onClick={handleSubmit}
        disabled={!allDone || loading}
        style={{ fontSize:15, padding:"13px 28px" }}
      >
        {loading ? "⏳ Analyzing 18 features…" : !allDone ? `Complete ${5-completedCount} more test${5-completedCount>1?"s":""}` : "🧠 Submit & Get Neural Pattern Analysis →"}
      </Btn>
    </div>
  );
}

function TestCard({ t, setPage, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <DarkCard
      style={{ padding:24, position:"relative", opacity:loading ? 0.6:1 }}
      onClick={loading ? undefined : () => setPage(t.id)}
      hover={!loading}
    >
      {t.done && (
        <div style={{ position:"absolute", top:14, right:14, background:`rgba(42,143,138,0.12)`, border:`1px solid ${LIME}44`, borderRadius:8, padding:"3px 10px", fontSize:10, color:LIME, fontWeight:700, letterSpacing:0.5 }}>
          ✓ DONE
        </div>
      )}
      <div style={{ width:46, height:46, borderRadius:12, background:`${t.accent}14`, border:`1px solid ${t.accent}2A`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:16 }}>
        {t.icon}
      </div>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:900, color:"#1C2F3A", fontSize:16, marginBottom:6, letterSpacing:"-0.3px" }}>{t.title}</div>
      <div style={{ color:"#555", fontSize:13, lineHeight:1.6, marginBottom:16 }}>{t.desc}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid rgba(28,58,68,0.10)`, paddingTop:14 }}>
        <span style={{ fontSize:11, color:"#444", fontWeight:600, letterSpacing:0.5 }}>⏱ {t.dur}</span>
        <span style={{ fontSize:12, color:t.done ? LIME : t.accent, fontWeight:700 }}>
          {t.done ? "Redo →" : "Start →"}
        </span>
      </div>
    </DarkCard>
  );
}