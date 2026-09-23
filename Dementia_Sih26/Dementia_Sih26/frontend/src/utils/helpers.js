// ── Design tokens — glass-compatible rgba values ───────────────────────────
export const T = {
  bg:  "#F6F3ED",
  bg1: "#FFFFFF",
  bg2: "#F0F6F6",
  bg3: "#E7F1F2",
  card:       "#FFFFFF",
  cardBorder: "rgba(28, 58, 68, 0.12)",
  cream: "#1C2F3A", creamDim: "#3D5563", creamFaint: "#5C7382",
  red: "#C45C5C", redGlow: "rgba(196,92,92,0.22)", redFaint: "rgba(196,92,92,0.12)",
  green: "#2F9E7A", amber: "#C4842A", blue: "#3A7CA5", white: "#fff",
  lime: "#2A8F8A", lavender: "#6B63A5",
};

export const injectStyles = () => {
  if (document.getElementById("na-styles")) return;
  const s = document.createElement("style");
  s.id = "na-styles";
  s.innerHTML = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes float      { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-6px)} }
    @keyframes floatR     { 0%,100%{transform:translateY(0) rotate(1deg)}  50%{transform:translateY(-6px) rotate(1deg)} }
    @keyframes floatL     { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-8px) rotate(-1deg)} }
    @keyframes blink      { 0%,100%{opacity:1}    50%{opacity:0.35}  }
    @keyframes record-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(42,143,138,0.4)} 70%{box-shadow:0 0 0 16px rgba(42,143,138,0)} }
    @keyframes twinkle    { 0%,100%{opacity:0.18} 50%{opacity:0.5} }
    @keyframes glow-pulse { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.04)} }
  `;
  document.head.appendChild(s);
};

export const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
