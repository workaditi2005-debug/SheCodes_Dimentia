import { useEffect, useState } from "react";
import { getIsOnline, onSyncStatus, syncNow } from "../../utils/syncManager";

export default function OfflineStatusIndicator() {
  const [state, setState] = useState({ online: getIsOnline(), pending: 0, syncing: false });
  useEffect(() => onSyncStatus(setState), []);
  const label = !state.online ? `Offline · ${state.pending} pending` : state.syncing ? "Syncing…" : state.pending ? `${state.pending} waiting to sync` : "Online · synced";
  return <button onClick={syncNow} title="Synchronize saved changes" style={{ border: `1.5px solid ${state.online ? "#2F9E7A" : "#C4842A"}`, background: state.online ? "#E8F6F0" : "#F8EEDD", color: "#1C2F3A", borderRadius: 999, padding: "8px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{state.online ? "●" : "●"} {label}</button>;
}

