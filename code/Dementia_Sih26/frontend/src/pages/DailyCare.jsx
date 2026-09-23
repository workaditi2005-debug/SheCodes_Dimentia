import { useEffect, useState, useRef } from "react";
import { toggleReminderStatus, getMemoryItems, getReminders } from "../services/api";
import { useI18n } from "../i18n/LanguageContext";
import { speak, playSelectSound } from "../utils/voice";
import { registerVoiceContext } from "../utils/voiceDispatcher";
import { useVoicePageAnnouncer } from "../hooks/useVoicePageAnnouncer";
import { DarkCard, Btn, Badge } from "../components/RiskDashboard";

const LIME = "#2A8F8A";
const GRN  = "#2F9E7A";
const AMB  = "#C4842A";

export default function DailyCare() {
  const { t, language } = useI18n();
  const [reminders, setReminders] = useState([]);
  const [memories, setMemories] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);
  const remindersRef = useRef([]);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    Promise.all([getReminders(), getMemoryItems()])
      .then(([r, m]) => {
        setReminders(r || []);
        setMemories(m || []);
      })
      .catch(() => {});
  }, []);

  async function handleToggle(id, title, currentStatus) {
    playSelectSound();
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    
    // Optimistic UI update
    setReminders(list => list.map(r => r.id === id ? { ...r, status: nextStatus } : r));

    if (nextStatus === "completed") {
      const msg = `Marked "${title}" complete.`;
      setToastMsg({ text: msg, isDone: true });
      speak(t("reminderDone", "Reminder marked complete."), language);
    } else {
      const msg = `Marked "${title}" pending (unmarked).`;
      setToastMsg({ text: msg, isDone: false });
      speak(t("reminderUnmarked", "Reminder unmarked."), language);
    }

    setTimeout(() => setToastMsg(null), 3500);

    try {
      const updatedItem = await toggleReminderStatus(id, nextStatus);
      if (updatedItem) {
        setReminders(list => list.map(r => r.id === id ? { ...r, ...updatedItem, status: nextStatus } : r));
      }
    } catch (e) {
      // Revert if error
      setReminders(list => list.map(r => r.id === id ? { ...r, status: currentStatus } : r));
    }
  }

  const completedCount = reminders.filter(r => r.status === "completed").length;
  const pendingReminders = reminders.filter(r => r.status !== "completed");
  const completionPct = reminders.length > 0 ? Math.round((completedCount / reminders.length) * 100) : 0;

  // ── Voice: Register daily care context ────────────────────────────────
  useEffect(() => {
    const unregister = registerVoiceContext("daily_care", (rawText, parsed) => {
      const text = rawText.toLowerCase();
      const pending = remindersRef.current.filter(r => r.status !== "completed");

      // "what do I need to do" / "what's pending"
      if (/what.*(pending|need|today|left|remaining)|pending|list|remind/i.test(text)) {
        if (pending.length === 0) {
          return { handled: true, speakText: "All done! You have completed all your reminders for today. Great work!" };
        }
        const names = pending.slice(0, 3).map(r => r.title).join(", ");
        const more = pending.length > 3 ? ` and ${pending.length - 3} more` : "";
        return {
          handled: true,
          speakText: `You have ${pending.length} pending: ${names}${more}. Say "mark done" to complete the first one.`,
        };
      }

      // "mark done" / "I took it" / "done" / "finished"
      if (/mark.*done|i took|i've taken|done|finished|completed|complete it/i.test(text)) {
        if (pending.length === 0) {
          return { handled: true, speakText: "All your reminders are already complete. Well done!" };
        }
        const first = pending[0];
        handleToggle(first.id, first.title, first.status);
        return {
          handled: true,
          speakText: `Marked "${first.title}" as complete.`,
        };
      }

      return false;
    }, pendingReminders.map(r => ({ id: r.id, label: r.title })));

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  // ── Voice: Proactive reminder summary on mount ──────────────────────
  const langCode = (language || "en-IN").split("-")[0].toLowerCase();
  const pending = reminders.filter(r => r.status !== "completed");
  const careAnnouncement = langCode === "hi"
    ? [
        "आपकी दैनंदिन देखभाल खुल गई है।",
        pending.length > 0
          ? `आपके आज ${pending.length} याद बाकी हैं। "मार्क डन" कहें पहले को पूरा करने के लिए।`
          : "आज के सभी काम पूरे हो गए। शाबाश!",
      ]
    : langCode === "bn"
    ? [
        "আপনার দৈনিক যত্ন খুলেছে।",
        pending.length > 0
          ? `আজকে আপনার ${pending.length}টি কাজ বাকি রয়েছে। "মার্ক ডান" বলুন প্রথমটি সম্পন্ন করতে।`
          : "আজকের সব কাজ হয়ে গেছে। খুব ভালো!",
      ]
    : [
        "Here are your reminders for today.",
        pending.length > 0
          ? `You have ${pending.length} item${pending.length > 1 ? "s" : ""} still pending. Say "mark done" to complete the first one.`
          : "All done! You have completed everything for today. Well done!",
      ];

  useVoicePageAnnouncer(null, careAnnouncement);

  const todayDateString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingBottom: 48, color: "#1C2F3A", fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Banner Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(42,143,138,0.10)", border: `1px solid ${LIME}33`, borderRadius: 99, padding: "5px 14px", marginBottom: 12, fontSize: 11, fontWeight: 700, color: LIME, letterSpacing: 1.5, textTransform: "uppercase" }}>
          <span>🌿</span> Daily Care Center • Dementia Support
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: "clamp(28px, 4vw, 42px)", margin: "0 0 8px", color: "#1C2F3A", letterSpacing: "-1px" }}>
              {t("dailyCare", "Daily Care Center")}
            </h1>
            <p style={{ color: "#5C7382", fontSize: 16, margin: 0, maxWidth: 640, lineHeight: 1.5 }}>
              Today is <strong>{todayDateString}</strong>. Reminders and familiar memory items stay readily accessible.
            </p>
          </div>
          {reminders.length > 0 && (
            <div style={{ background: "#FFFFFF", padding: "10px 18px", borderRadius: 16, border: "1px solid rgba(28,58,68,0.12)", boxShadow: "0 4px 14px rgba(28,47,58,0.05)" }}>
              <span style={{ fontSize: 13, color: "#5C7382", fontWeight: 600 }}>Daily Progress: </span>
              <strong style={{ fontSize: 16, color: completedCount === reminders.length ? GRN : LIME }}>
                {completedCount} / {reminders.length} Done
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          background: toastMsg.isDone ? "rgba(47,158,122,0.12)" : "rgba(196,132,42,0.12)",
          border: `1px solid ${toastMsg.isDone ? "rgba(47,158,122,0.35)" : "rgba(196,132,42,0.35)"}`,
          color: toastMsg.isDone ? "#1E6B4F" : "#875614",
          borderRadius: 14,
          padding: "14px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 15,
          fontWeight: 700,
          animation: "slide-up 0.3s ease",
          boxShadow: "0 6px 18px rgba(28,47,58,0.06)",
        }}>
          <span style={{ fontSize: 18 }}>{toastMsg.isDone ? "✓" : "↩"}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ── Summary Progress Bar Card ── */}
      {reminders.length > 0 && (
        <DarkCard style={{ padding: "20px 24px", marginBottom: 32 }} hover={false}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#5C7382", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" }}>
              Today's Care Completion
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: completedCount === reminders.length ? GRN : LIME }}>
              {completionPct}% Complete
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(28,58,68,0.10)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${completionPct}%`, background: `linear-gradient(90deg, ${LIME}, #1F716D)`, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          {completedCount === reminders.length && reminders.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: GRN, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓</span> Great job! All scheduled daily items and medications are checked off for today.
            </div>
          )}
        </DarkCard>
      )}

      {/* ── Section 1: Routine & Medicines ── */}
      <section style={{ marginBottom: 44 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C2F3A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span>⏰</span> {t("reminders", "Today's Routine & Medications")}
            </h2>
            <p style={{ color: "#5C7382", fontSize: 14, margin: "4px 0 0" }}>
              Tap any item to check it off. Voice commands like <em>"Mark done"</em> are also supported.
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: LIME, background: `${LIME}14`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${LIME}30` }}>
            {pendingReminders.length} Pending
          </span>
        </div>

        {reminders.length === 0 ? (
          <DarkCard style={{ padding: "40px 24px", textAlign: "center" }} hover={false}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1C2F3A", marginBottom: 6 }}>No Reminders Scheduled</h3>
            <p style={{ color: "#5C7382", fontSize: 14, margin: 0 }}>You have no routine tasks or medicines recorded right now.</p>
          </DarkCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {reminders.map(r => {
              const isDone = r.status === "completed";
              const isMed = r.title.toLowerCase().includes("donepezil") ||
                            r.title.toLowerCase().includes("medicine") ||
                            r.title.toLowerCase().includes("tablet") ||
                            r.title.toLowerCase().includes("dose");

              return (
                <div
                  key={r.id}
                  style={{
                    background: isDone ? "#F2F8F6" : "#FFFFFF",
                    border: `1.5px solid ${isDone ? "rgba(47,158,122,0.35)" : "rgba(28,58,68,0.12)"}`,
                    borderRadius: 20,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    transition: "all 0.2s ease",
                    boxShadow: isDone ? "none" : "0 8px 24px rgba(28,47,58,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Icon Container */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: isDone ? "rgba(47,158,122,0.14)" : isMed ? "rgba(42,143,138,0.12)" : "rgba(96,165,250,0.12)",
                      border: `1px solid ${isDone ? "rgba(47,158,122,0.35)" : isMed ? `${LIME}33` : "rgba(96,165,250,0.3)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}>
                      {isMed ? "💊" : "💧"}
                    </div>

                    {/* Content */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          color: isDone ? GRN : LIME,
                          background: isDone ? "rgba(47,158,122,0.12)" : "rgba(42,143,138,0.10)",
                          border: `1px solid ${isDone ? "rgba(47,158,122,0.25)" : `${LIME}30`}`,
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 0.5,
                        }}>
                          {r.scheduled_time || "Scheduled"}
                        </span>
                        {isDone && (
                          <span style={{ fontSize: 12, color: GRN, fontWeight: 700 }}>
                            ✓ Done
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: isDone ? "#5C7382" : "#1C2F3A",
                        textDecoration: isDone ? "line-through" : "none",
                        lineHeight: 1.3,
                      }}>
                        {r.title}
                      </div>

                      {r.description && (
                        <div style={{ color: "#5C7382", fontSize: 14, marginTop: 4, lineHeight: 1.4 }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Large Action Toggle Button */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggle(r.id, r.title, r.status)}
                      title={isDone ? "Click to unmark as pending" : "Click to mark as complete"}
                      style={{
                        padding: "12px 22px",
                        borderRadius: 14,
                        border: isDone ? "1.5px solid rgba(47,158,122,0.4)" : "none",
                        background: isDone ? "rgba(47,158,122,0.14)" : `linear-gradient(135deg, ${LIME}, #1F716D)`,
                        color: isDone ? "#1E6B4F" : "#FFFFFF",
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: isDone ? "none" : "0 4px 16px rgba(42,143,138,0.25)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={e => {
                        if (isDone) {
                          e.currentTarget.style.background = "rgba(196,92,92,0.12)";
                          e.currentTarget.style.borderColor = "rgba(196,92,92,0.35)";
                          e.currentTarget.style.color = "#991B1B";
                        } else {
                          e.currentTarget.style.opacity = "0.92";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (isDone) {
                          e.currentTarget.style.background = "rgba(47,158,122,0.14)";
                          e.currentTarget.style.borderColor = "rgba(47,158,122,0.4)";
                          e.currentTarget.style.color = "#1E6B4F";
                        } else {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.transform = "none";
                        }
                      }}
                    >
                      <span>{isDone ? "✓" : "○"}</span>
                      <span>{isDone ? "Completed (Undo)" : "Mark Done"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Personal Memory Anchors ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C2F3A", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <span>🧠</span> {t("memories", "Personal Memory Anchors")}
            </h2>
            <p style={{ color: "#5C7382", fontSize: 14, margin: "4px 0 0" }}>
              Familiar people, places, and cultural anchors to reinforce memory and emotional security.
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: LIME, background: `${LIME}14`, padding: "4px 12px", borderRadius: 20, border: `1px solid ${LIME}30` }}>
            {memories.length} Anchors
          </span>
        </div>

        {memories.length === 0 ? (
          <DarkCard style={{ padding: "40px 24px", textAlign: "center" }} hover={false}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌸</div>
            <h3 style={{ fontWeight: 800, fontSize: 18, color: "#1C2F3A", marginBottom: 6 }}>Memory Bank Ready</h3>
            <p style={{ color: "#5C7382", fontSize: 14, margin: 0 }}>Your caregiver can add meaningful photos, names, and familiar prompts.</p>
          </DarkCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {memories.map(m => (
              <DarkCard key={m.id} style={{ padding: "24px 22px" }} hover={true}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(42,143,138,0.08)",
                    border: "1px solid rgba(42,143,138,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    flexShrink: 0,
                  }}>
                    {m.image_emoji || "🌸"}
                  </div>
                  <div>
                    <div style={{ display: "inline-block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: LIME, background: `${LIME}14`, padding: "2px 8px", borderRadius: 6, marginBottom: 4, letterSpacing: 0.5 }}>
                      {m.category || "Memory Anchor"}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#1C2F3A", lineHeight: 1.2 }}>
                      {m.name}
                    </div>
                  </div>
                </div>

                <div style={{ color: "#3D5563", fontSize: 14, lineHeight: 1.5, background: "#F7FAF9", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(28,58,68,0.08)" }}>
                  {m.relationship_or_context}
                </div>
              </DarkCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
