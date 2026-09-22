import { useState, useEffect, useRef } from "react";
import { T } from "../utils/theme";
import { getUser, getConversations, getMessages, sendMessage, deleteMessage, getPatients, getDoctors } from "../services/api";

const LIME = "#2A8F8A";

function timeAgo(ts) {
  if (!ts) return "";
  const d = new Date(ts.endsWith("Z") ? ts : ts + "Z");
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name = "?", role, size = 36 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = role === "doctor" ? "#60a5fa" : LIME;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}18`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: "#1C2F3A", fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
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
    <div style={{ display: "flex", height: "calc(100vh - 100px)", gap: 0, overflow: "hidden", borderRadius: 16, border: "1px solid rgba(28,58,68,0.10)" }}>

      {/* ── Left: conversation list ── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid rgba(28,58,68,0.10)", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)" }}>
        
        {/* Header */}
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid rgba(28,58,68,0.10)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 16, fontFamily: "'DM Sans',sans-serif" }}>Messages</div>
            {/* New Chat button */}
            <button onClick={openPicker}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: `linear-gradient(135deg,${LIME},#1F716D)`, border: "none", color: "#F6F3ED", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              ✏️ New
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#555" }}>
            {isDoctor ? "Chat with your patients" : "Chat with your doctor"}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, color: "#555", fontSize: 13, textAlign: "center" }}>Loading…</div>
          ) : convs.length === 0 && !showPicker ? (
            <div style={{ padding: 28, color: "#555", fontSize: 13, textAlign: "center", lineHeight: 1.8 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>💬</div>
              {isDoctor
                ? <>No enrolled patients yet.<br /><span style={{ fontSize: 11 }}>Approve enrollment requests to start chatting.</span></>
                : <>No doctor assigned yet.<br /><span style={{ fontSize: 11 }}>Enroll with a doctor from your dashboard first.</span></>
              }
            </div>
          ) : convs.map(conv => {
            const isActive = active?.user_id === conv.user_id && !showPicker;
            return (
              <div key={conv.user_id} onClick={() => openConv(conv)}
                style={{ padding: "12px 16px", cursor: "pointer", background: isActive ? `${LIME}12` : "transparent", borderLeft: `3px solid ${isActive ? LIME : "transparent"}`, transition: "all 0.15s" }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = "#FFFFFF")}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={conv.full_name} role={conv.role} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.full_name}</span>
                      <span style={{ fontSize: 10, color: "#444", flexShrink: 0, marginLeft: 4 }}>{timeAgo(conv.last_ts)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.role === "doctor" ? "🩺" : "👤"} {conv.last_msg ? conv.last_msg.slice(0, 28) + (conv.last_msg.length > 28 ? "…" : "") : "No messages yet"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      {showPicker ? (
        /* New chat person picker */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(28,58,68,0.10)", display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setShowPicker(false)} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
            <div>
              <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 15 }}>New Conversation</div>
              <div style={{ fontSize: 11, color: "#555" }}>Select {isDoctor ? "a patient" : "your doctor"} to message</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {pickList.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>👥</div>
                {isDoctor
                  ? "No enrolled patients yet. Patients will appear here once you approve their enrollment requests."
                  : "No doctor assigned yet. Go to your dashboard → My Doctor section to request enrollment."}
              </div>
            ) : pickList.map(p => (
              <div key={p.user_id} onClick={() => openConv(p)}
                style={{ padding: "14px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#FFFFFF"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar name={p.full_name} role={p.role} size={46} />
                <div>
                  <div style={{ fontWeight: 700, color: "#1C2F3A", fontSize: 15 }}>{p.full_name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {p.role === "doctor" ? "🩺 Doctor" : "👤 Patient"} · {p.email}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", color: LIME, fontSize: 13, fontWeight: 700 }}>Message →</div>
              </div>
            ))}
          </div>
        </div>
      ) : !active ? (
        /* No conversation selected */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#444" }}>
          <div style={{ fontSize: 56, opacity: 0.3 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#333" }}>Select a conversation</div>
          <button onClick={openPicker}
            style={{ padding: "10px 24px", borderRadius: 12, background: `linear-gradient(135deg,${LIME},#1F716D)`, border: "none", color: "#F6F3ED", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            ✏️ Start New Chat
          </button>
        </div>
      ) : (
        /* Active chat */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Chat header */}
          <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(28,58,68,0.10)", display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={active.full_name} role={active.role} size={42} />
            <div>
              <div style={{ fontWeight: 900, color: "#1C2F3A", fontSize: 15 }}>{active.full_name}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                {active.role === "doctor" ? "🩺 Doctor" : "👤 Patient"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 8px ${LIME}` }} />
              <span style={{ fontSize: 11, color: "#555" }}>Active</span>
            </div>
          </div>

          {/* Message thread */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#555", paddingBottom: 60 }}>
                <div style={{ fontSize: 42, opacity: 0.2 }}>👋</div>
                <div style={{ fontSize: 14 }}>No messages yet</div>
                <div style={{ fontSize: 12 }}>Say hello to {active.full_name}!</div>
              </div>
            ) : messages.map(msg => {
              const isMe  = msg.sender_id === myId;
              const isHov = hovMsg === msg.id;
              return (
                <div key={msg.id}
                  style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}
                  onMouseEnter={() => setHovMsg(msg.id)}
                  onMouseLeave={() => setHovMsg(null)}>
                  {!isMe && <Avatar name={msg.sender_name} role={msg.sender_role} size={30} />}
                  <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 2 }}>
                    {!isMe && <div style={{ fontSize: 10, color: "#555", paddingLeft: 2 }}>{msg.sender_name}</div>}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? `linear-gradient(135deg,${LIME},#1F716D)` : "#EAF1F2",
                        color: isMe ? "#F6F3ED" : "#fff",
                        fontSize: 14, lineHeight: 1.55, fontWeight: isMe ? 500 : 400,
                        wordBreak: "break-word",
                        boxShadow: isMe ? `0 2px 10px ${LIME}22` : "none",
                      }}>
                        {msg.text}
                      </div>
                      {isHov && isMe && (
                        <button onClick={() => handleDelete(msg.id)} disabled={deleting === msg.id}
                          style={{ background: "rgba(232,64,64,0.15)", border: "1px solid rgba(232,64,64,0.3)", borderRadius: 8, padding: "3px 8px", color: T.red, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                          {deleting === msg.id ? "…" : "✕"}
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#444" }}>{timeAgo(msg.timestamp)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(28,58,68,0.10)", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${active.full_name}…`}
              rows={1}
              style={{ flex: 1, padding: "11px 15px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(28,58,68,0.09)", color: "#1C2F3A", fontSize: 14, fontFamily: "'DM Sans',sans-serif", resize: "none", outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            />
            <button onClick={handleSend} disabled={!text.trim() || sending}
              style={{ padding: "11px 20px", borderRadius: 14, background: text.trim() ? `linear-gradient(135deg,${LIME},#1F716D)` : "#F4F8F8", color: text.trim() ? "#F6F3ED" : "#555", fontWeight: 900, fontSize: 14, border: "none", cursor: text.trim() ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", flexShrink: 0, transition: "all 0.2s" }}>
              {sending ? "⏳" : "Send →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}