import React, { useState, useEffect } from "react";
import { getRhythmAnalytics, getRhythmSessions, deleteRhythmSession } from "../../../services/api";

export default function RhythmAnalytics({ patientId, onOpenPreferences }) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [analyticsData, sessionHistory] = await Promise.all([
        getRhythmAnalytics(patientId).catch(() => null),
        getRhythmSessions(patientId, 15).catch(() => ({ sessions: [] })),
      ]);
      setAnalytics(analyticsData);
      setSessions(sessionHistory?.sessions || []);
    } catch (err) {
      setErrorMsg("Failed to load music engagement analytics.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session record?")) return;
    try {
      setDeletingId(sessionId);
      await deleteRhythmSession(sessionId);
      setSessions(sessions.filter((s) => s.session_id !== sessionId));
      // Refresh analytics
      const updatedAnalytics = await getRhythmAnalytics(patientId).catch(() => null);
      if (updatedAnalytics) setAnalytics(updatedAnalytics);
    } catch (err) {
      alert("Failed to delete session: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#5C7382] bg-white rounded-2xl border border-[rgba(28,58,68,0.12)] shadow-sm">
        Loading Rhythm & Recall engagement analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Notice */}
      <div className="bg-white p-6 rounded-2xl border border-[rgba(28,58,68,0.12)] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <h3 className="text-xl font-bold text-[#1C2F3A]">Rhythm & Recall — Engagement Summary</h3>
          </div>
          <p className="text-xs text-[#5C7382] mt-1 font-medium">
            Longitudinal observation of music participation, song recognition, and emotional responses.
          </p>
        </div>
        {onOpenPreferences && (
          <button
            onClick={onOpenPreferences}
            className="px-4 py-2.5 bg-white hover:bg-[#F4F8F8] text-[#1B6360] border border-[#2A8F8A] text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            ⚙️ Music Preferences
          </button>
        )}
      </div>

      {/* Non-clinical Medical Positioning Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <span className="text-base">ℹ️</span>
        <div>
          <span className="font-bold">Engagement Observation Notice:</span> Metrics reflect enjoyment, engagement, and song participation. These statistics are NOT diagnostic indicators and do NOT compute dementia severity.
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#5C7382] uppercase tracking-wider">
            Total Sessions
          </div>
          <div className="text-3xl font-extrabold text-[#1C2F3A]">
            {analytics?.total_sessions || 0}
          </div>
          <div className="text-xs text-[#5C7382] font-medium">
            {analytics?.sessions_this_week || 0} sessions this past week
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#5C7382] uppercase tracking-wider">
            Avg Song Recognition
          </div>
          <div className="text-3xl font-extrabold text-[#2A8F8A]">
            {analytics?.avg_recognition_pct !== null && analytics?.avg_recognition_pct !== undefined
              ? `${analytics.avg_recognition_pct}%`
              : "N/A"}
          </div>
          <div className="text-xs text-[#5C7382] font-medium">
            Recognized familiar song snippets
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#5C7382] uppercase tracking-wider">
            Rhythm Participation
          </div>
          <div className="text-xl font-bold text-[#0F766E]">
            {analytics?.rhythm_participation_label || "No sessions"}
          </div>
          <div className="text-xs text-[#5C7382] font-medium">
            Motor tapping consistency
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm space-y-1">
          <div className="text-xs font-bold text-[#5C7382] uppercase tracking-wider">
            Voice Participation
          </div>
          <div className="text-3xl font-extrabold text-[#7C3AED]">
            {analytics?.voice_participation_pct !== undefined
              ? `${analytics.voice_participation_pct}%`
              : "0%"}
          </div>
          <div className="text-xs text-[#5C7382] font-medium">
            Sessions with hum-along/singing
          </div>
        </div>
      </div>

      {/* Trend Note */}
      {analytics?.trend_note && (
        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#E7F4F3] text-xl">📈</div>
          <div>
            <h4 className="text-sm font-bold text-[#1C2F3A]">Longitudinal Trend Observation</h4>
            <p className="text-sm text-[#3D5563] mt-1">{analytics.trend_note}</p>
          </div>
        </div>
      )}

      {/* Recent Mood Responses */}
      {analytics?.recent_mood_responses && analytics.recent_mood_responses.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-[rgba(28,58,68,0.12)] shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-[#1C2F3A]">Recent Post-Music Emotional Responses</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.recent_mood_responses.map((mood, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-[#F4F8F8] text-[#1C2F3A] border border-[rgba(28,58,68,0.12)] text-xs font-semibold flex items-center gap-1"
              >
                <span>😊</span> {mood}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Session History Table */}
      <div className="bg-white rounded-2xl border border-[rgba(28,58,68,0.12)] shadow-sm p-6 space-y-4">
        <h4 className="text-base font-bold text-[#1C2F3A]">Recent Session History</h4>

        {sessions.length === 0 ? (
          <p className="text-sm text-[#5C7382] py-4 text-center">No music sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#1C2F3A]">
              <thead className="text-xs text-[#5C7382] uppercase bg-[#F4F8F8] border-b border-[rgba(28,58,68,0.10)] font-bold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Recognition</th>
                  <th className="p-3">Rhythm Taps</th>
                  <th className="p-3">Voice</th>
                  <th className="p-3">Engagement Summary</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(28,58,68,0.06)]">
                {sessions.map((s) => (
                  <tr key={s.session_id} className="hover:bg-[#F4F8F8] transition-colors">
                    <td className="p-3 font-mono text-xs text-[#5C7382]">
                      {s.timestamp ? new Date(s.timestamp).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3 capitalize font-bold text-[#1C2F3A]">
                      {s.mode?.replace("_", " ") || "Music"}
                    </td>
                    <td className="p-3 font-semibold">
                      {s.recognition_pct !== null && s.recognition_pct !== undefined
                        ? `${s.recognition_pct}%`
                        : "—"}
                    </td>
                    <td className="p-3">{s.tap_count || 0} taps</td>
                    <td className="p-3">{s.voice_participated ? "Yes 🎤" : "No"}</td>
                    <td className="p-3 text-xs text-[#0F6B45] font-semibold">
                      {s.engagement_label || s.encouragement || "Completed"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteSession(s.session_id)}
                        disabled={deletingId === s.session_id}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Delete session record"
                      >
                        {deletingId === s.session_id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
