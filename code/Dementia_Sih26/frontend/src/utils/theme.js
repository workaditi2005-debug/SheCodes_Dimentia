// ── Design tokens — calm premium healthcare (elderly-friendly) ─────────────
export const T = {
  bg:  "#F6F3ED",
  bg1: "#FFFFFF",
  bg2: "#F0F6F6",
  bg3: "#E7F1F2",
  card:       "#FFFFFF",
  cardBorder: "rgba(28, 58, 68, 0.12)",
  white:   "#FFFFFF",
  cream:   "#1C2F3A",
  creamDim:"#3D5563",
  creamFaint:"#5C7382",
  lime:    "#2A8F8A",
  limeDim: "#1F716D",
  red:     "#C45C5C",
  redGlow: "rgba(196,92,92,0.22)",
  redFaint:"rgba(196,92,92,0.12)",
  green:   "#2F9E7A",
  amber:   "#C4842A",
  blue:    "#3A7CA5",
  lavender:"#6B63A5",
};

export const injectStyles = () => {
  if (document.getElementById("na-styles")) return;
  const s = document.createElement("style");
  s.id = "na-styles";
  s.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @keyframes float-up   { 0%,100%{transform:translateY(0)}        50%{transform:translateY(-6px)} }
    @keyframes pulse-dot  { 0%,100%{transform:scale(1);opacity:1}   50%{transform:scale(1.25);opacity:0.7} }
    @keyframes blink      { 0%,100%{opacity:1}    50%{opacity:0.35}  }
    @keyframes record-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(42,143,138,0.35)} 70%{box-shadow:0 0 0 14px rgba(42,143,138,0)} }
    @keyframes twinkle    { 0%,100%{opacity:0.18;transform:scale(1)} 50%{opacity:0.55;transform:scale(1.15)} }
    @keyframes glow-pulse { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.04)} }
    @keyframes scan-line  { 0%{top:-2px} 100%{top:100%} }
    @keyframes slide-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ghost-drift { 0%,100%{opacity:0.04} 50%{opacity:0.07} }
    select { color-scheme: light; }
    select option { background: #FFFFFF !important; color: #1C2F3A !important; }
    button, input, select, textarea { font-family: 'Source Sans 3', 'DM Sans', sans-serif; }
  `;
  document.head.appendChild(s);
};
