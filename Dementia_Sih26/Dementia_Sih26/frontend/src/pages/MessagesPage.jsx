import { useState, useEffect, useRef } from "react";
import { T } from "../utils/theme";
import { getUser, getConversations, getMessages, sendMessage, deleteMessage, getPatients, getDoctors } from "../services/api";

const LIME = "#2A8F8A";

function timeAgo(ts) {
  if (!ts) return "";
  try {
    let d = new Date(ts);
    if (isNaN(d.getTime())) {
      d = new Date(ts.endsWith("Z") ? ts : ts + "Z");
    }
    if (isNaN(d.getTime())) return "Recently";

    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 0) return "just now";
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

function Avatar({ name = "?", role, size = 38 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isDoc = role === "doctor";
  const bg = isDoc ? "rgba(96,165,250,0.15)" : "rgba(42,143,138,0.15)";
  const border = isDoc ? "#60a5fa" : "#2A8F8A";
  const color = isDoc ? "#1D4ED8" : "#1B6360";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `1.5px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color,
        fontWeight: 800,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function MessagesPage() {
  const me = getUser();
  const isDoctor = me?.role === "doctor";

  const [convs,      setConvs]      = useState([]);
  const [active,     setActive]     = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [text,       setText]       = useState("");
  const [loading,    setLoading]    = useState(true);
  const [sending,    setSending]    = useState(false);
  const [hovMsg,     setHovMsg]     = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [showPicker, setShowPicker] = useState(false); // new chat picker
  const [pickList,   setPickList]   = useState([]);    // list of people to start chat with

  const bottomRef = useRef(null);
  const pollRef   = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    loadConvs();
    return () => clearInterval(pollRef.current);
  }, []);

  async function loadConvs() {
    setLoading(true);
    try {
      const list = await getConversations();
      setConvs(list || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function openConv(conv) {
    setActive(conv);
    setShowPicker(false);
    loadMsgs(conv.user_id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMsgs(conv.user_id), 4000);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function loadMsgs(otherId) {
    try {
      const msgs = await getMessages(otherId);
      setMessages(msgs || []);
    } catch (e) {}
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // "New Chat" — load the people this user can message
  async function openPicker() {
    setShowPicker(true);
    setActive(null);
    clearInterval(pollRef.current);
    try {
      if (isDoctor) {
        const list = await getPatients();
        setPickList((list || []).map(p => ({ user_id: p.id, full_name: p.full_name, role: "patient", email: p.email })));
      } else {
        const list = await getDoctors();
        setPickList((list || []).map(d => ({ user_id: d.id, full_name: d.full_name, role: "doctor", email: d.email })));
      }
    } catch (e) { setPickList([]); }
  }

  async function handleSend() {
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const txt = text.trim();
    setText("");
    try {
      await sendMessage(active.user_id, txt);
      await loadMsgs(active.user_id);
      await loadConvs();
    } catch (e) { alert("Failed to send: " + e.message); }
    finally { setSending(false); }
  }

  async function handleDelete(msgId) {
    setDeleting(msgId);
    try {
      await deleteMessage(msgId);
      setMessages(m => m.filter(msg => msg.id !== msgId));
    } catch (e) { alert("Failed to delete."); }
    finally { setDeleting(null); }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const myId = me?.id;

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 110px)",
        gap: 0,
        overflow: "hidden",
        borderRadius: 20,
        border: "1.5px solid rgba(28,58,68,0.12)",
        background: "#FFFFFF",
        boxShadow: "0 8px 30px rgba(28,47,58,0.06)",
      }}
    >
      {/* ── Left: conversation list ── */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          borderRight: "1.5px solid rgba(28,58,68,0.10)",
          display: "flex",
          flexDirection: "column",
          background: "#FBF9F5",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(28,58,68,0.10)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 18, fontFamily: "'DM Sans',sans-serif" }}>
              Messages
            </div>
            {/* New Chat button */}
            <button
              onClick={openPicker}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 20,
                background: "#2A8F8A",
                border: "none",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(42,143,138,0.25)",
              }}
            >
              ✏️ New Chat
            </button>
          </div>
          <div style={{ fontSize: 13, color: "#5C7382", fontWeight: 600 }}>
            {isDoctor ? "Care team & patient discussions" : "Direct messaging with your doctor"}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 28, color: "#5C7382", fontSize: 14, textAlign: "center", fontWeight: 600 }}>
              Loading conversations…
            </div>
          ) : convs.length === 0 && !showPicker ? (
            <div style={{ padding: 32, color: "#5C7382", fontSize: 14, textAlign: "center", lineHeight: 1.8 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>💬</div>
              {isDoctor ? (
                <>
                  <strong style={{ color: "#1C2F3A" }}>No enrolled patients yet.</strong>
                  <br />
                  <span style={{ fontSize: 13 }}>Approve enrollment requests in the Care Team portal to start chatting.</span>
                </>
              ) : (
                <>
                  <strong style={{ color: "#1C2F3A" }}>No doctor assigned yet.</strong>
                  <br />
                  <span style={{ fontSize: 13 }}>Enroll with a doctor from your dashboard to begin messaging.</span>
                </>
              )}
            </div>
          ) : (
            convs.map((conv) => {
              const isActive = active?.user_id === conv.user_id && !showPicker;
              return (
                <div
                  key={conv.user_id}
                  onClick={() => openConv(conv)}
                  style={{
                    padding: "14px 18px",
                    cursor: "pointer",
                    background: isActive ? "#E7F4F3" : "transparent",
                    borderLeft: `4px solid ${isActive ? "#2A8F8A" : "transparent"}`,
                    transition: "all 0.15s ease",
                    borderBottom: "1px solid rgba(28,58,68,0.05)",
                  }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "#F4F8F8")}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={conv.full_name} role={conv.role} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span
                          style={{
                            fontWeight: isActive ? 800 : 700,
                            color: "#1C2F3A",
                            fontSize: 15,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {conv.full_name}
                        </span>
                        <span style={{ fontSize: 11, color: "#5C7382", flexShrink: 0, marginLeft: 6, fontWeight: 600 }}>
                          {timeAgo(conv.last_ts)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#5C7382", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.role === "doctor" ? "🩺" : "👤"} {conv.last_msg ? conv.last_msg.slice(0, 32) + (conv.last_msg.length > 32 ? "…" : "") : "No messages yet"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      {showPicker ? (
        /* New chat person picker */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#FFFFFF" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(28,58,68,0.10)", display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setShowPicker(false)}
              style={{
                background: "#F4F8F8",
                border: "1px solid rgba(28,58,68,0.12)",
                color: "#1C2F3A",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 10,
              }}
            >
              ← Back
            </button>
            <div>
              <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 17 }}>New Conversation</div>
              <div style={{ fontSize: 13, color: "#5C7382" }}>
                Select {isDoctor ? "a patient" : "your doctor"} to message
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {pickList.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "#5C7382", fontSize: 15 }}>
                <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.4 }}>👥</div>
                {isDoctor
                  ? "No enrolled patients yet. Patients will appear here once you approve their enrollment requests."
                  : "No doctor assigned yet. Go to your dashboard → My Doctor section to request enrollment."}
              </div>
            ) : (
              pickList.map((p) => (
                <div
                  key={p.user_id}
                  onClick={() => openConv(p)}
                  style={{
                    padding: "16px 24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    borderBottom: "1px solid rgba(28,58,68,0.06)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F8F8")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={p.full_name} role={p.role} size={46} />
                  <div>
                    <div style={{ fontWeight: 800, color: "#1C2F3A", fontSize: 16 }}>{p.full_name}</div>
                    <div style={{ fontSize: 13, color: "#5C7382", marginTop: 2, fontWeight: 500 }}>
                      {p.role === "doctor" ? "🩺 Doctor" : "👤 Patient"} · {p.email}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", color: "#2A8F8A", fontSize: 14, fontWeight: 800 }}>
                    Message →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : !active ? (
        /* No conversation selected */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#F6F3ED" }}>
          <div style={{ fontSize: 60, opacity: 0.35 }}>💬</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1C2F3A" }}>Select a conversation to start messaging</div>
          <p style={{ color: "#5C7382", fontSize: 14, maxWidth: 360, textAlign: "center", margin: 0 }}>
            Stay connected with your clinical care team for updates, reassurance, and questions.
          </p>
          <button
            onClick={openPicker}
            style={{
              padding: "12px 26px",
              borderRadius: 14,
              background: "#2A8F8A",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(42,143,138,0.25)",
            }}
          >
            ✏️ Start New Chat
          </button>
        </div>
      ) : (
        /* Active chat */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F6F3ED" }}>
          {/* Chat header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid rgba(28,58,68,0.10)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#FFFFFF",
            }}
          >
            <Avatar name={active.full_name} role={active.role} size={44} />
            <div>
              <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 17 }}>{active.full_name}</div>
              <div style={{ fontSize: 13, color: "#5C7382", marginTop: 2, fontWeight: 600 }}>
                {active.role === "doctor" ? "🩺 Attending Physician" : "👤 Enrolled Patient"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
              <span style={{ fontSize: 13, color: "#0F6B45", fontWeight: 700 }}>Active</span>
            </div>
          </div>

          {/* Message thread */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#5C7382", paddingBottom: 60 }}>
                <div style={{ fontSize: 44, opacity: 0.3 }}>👋</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2F3A" }}>No messages yet</div>
                <div style={{ fontSize: 14 }}>Send a friendly message to {active.full_name}!</div>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe  = msg.sender_id === myId;
                const isHov = hovMsg === msg.id;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: isMe ? "row-reverse" : "row",
                      gap: 10,
                      alignItems: "flex-end",
                    }}
                    onMouseEnter={() => setHovMsg(msg.id)}
                    onMouseLeave={() => setHovMsg(null)}
                  >
                    {!isMe && <Avatar name={msg.sender_name} role={msg.sender_role} size={32} />}
                    <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                      {!isMe && (
                        <div style={{ fontSize: 12, color: "#5C7382", paddingLeft: 2, fontWeight: 600 }}>
                          {msg.sender_name}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                        <div
                          style={{
                            padding: "12px 18px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "linear-gradient(135deg, #2A8F8A, #1F716D)" : "#FFFFFF",
                            color: isMe ? "#FFFFFF" : "#1C2F3A",
                            border: isMe ? "none" : "1.5px solid rgba(28,58,68,0.12)",
                            fontSize: 16,
                            lineHeight: 1.55,
                            fontWeight: 500,
                            wordBreak: "break-word",
                            boxShadow: isMe ? "0 4px 14px rgba(42,143,138,0.2)" : "0 4px 14px rgba(28,47,58,0.05)",
                          }}
                        >
                          {msg.text}
                        </div>
                        {isHov && isMe && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            disabled={deleting === msg.id}
                            style={{
                              background: "rgba(239,68,68,0.12)",
                              border: "1px solid rgba(239,68,68,0.25)",
                              borderRadius: 8,
                              padding: "4px 8px",
                              color: "#DC2626",
                              fontSize: 12,
                              cursor: "pointer",
                              flexShrink: 0,
                              fontWeight: 700,
                            }}
                          >
                            {deleting === msg.id ? "…" : "✕"}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#5C7382", fontWeight: 600 }}>
                        {timeAgo(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(28,58,68,0.10)",
              display: "flex",
              gap: 12,
              alignItems: "flex-end",
              background: "#FFFFFF",
            }}
          >
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${active.full_name}…`}
              rows={1}
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: 16,
                border: "1.5px solid rgba(28,58,68,0.15)",
                background: "#F8FAF9",
                color: "#1C2F3A",
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                padding: "14px 24px",
                borderRadius: 16,
                background: text.trim() ? "#2A8F8A" : "#E2EBEC",
                color: text.trim() ? "#FFFFFF" : "#5C7382",
                fontWeight: 900,
                fontSize: 15,
                border: "none",
                cursor: text.trim() ? "pointer" : "default",
                fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
                transition: "all 0.2s ease",
                boxShadow: text.trim() ? "0 4px 14px rgba(42,143,138,0.25)" : "none",
              }}
            >
              {sending ? "⏳" : "Send →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}