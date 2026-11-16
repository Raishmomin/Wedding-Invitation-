import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG } from "./config";
import { DOT_DATE } from "./share";

/* Share-preview card and RF icons, drawn with the invitation's own fonts and colours (see globals.css). */
const C = {
  ground: "#ddd0b8", cream: "#faf6ee", creamDeep: "#efe6d6",
  ink: "#3b3027", muted: "#857560", gold: "#b3925a", goldLight: "#dcc898",
};
const GOLD_SHEEN = "linear-gradient(135deg, #9c7c42 0%, #c5a567 40%, #efdfb0 52%, #c5a567 62%, #9c7c42 100%)";

const fontsDir = join(process.cwd(), "assets/fonts");
const [bodoni, bodoniItalic, bodoniSmall, bodoniSmallItalic, cormorant, cormorantMedium, script] = await Promise.all([
  readFile(join(fontsDir, "BodoniModa-Regular.ttf")),
  readFile(join(fontsDir, "BodoniModa-Italic.ttf")),
  readFile(join(fontsDir, "BodoniModa-SmallBold.ttf")),         // small optical size, bold: survives a 16px tab icon
  readFile(join(fontsDir, "BodoniModa-SmallBoldItalic.ttf")),
  readFile(join(fontsDir, "CormorantGaramond-400.ttf")),
  readFile(join(fontsDir, "CormorantGaramond-500.ttf")),
  readFile(join(fontsDir, "MrsSaintDelafield-Regular.ttf")),
]);
const MONO_FONTS = [
  { name: "Bodoni", data: bodoni, weight: 400, style: "normal" },
  { name: "Bodoni", data: bodoniItalic, weight: 400, style: "italic" },
  { name: "BodoniSmall", data: bodoniSmall, weight: 700, style: "normal" },
  { name: "BodoniSmall", data: bodoniSmallItalic, weight: 700, style: "italic" },
];
const ALL_FONTS = [
  ...MONO_FONTS,
  { name: "Cormorant", data: cormorant, weight: 400, style: "normal" },
  { name: "Cormorant", data: cormorantMedium, weight: 500, style: "normal" },
  { name: "Script", data: script, weight: 400, style: "normal" },
];

/* ---------- the RF monogram ----------
   Drawn on a 200×200 grid like the crest in lib/invitation.js, then scaled to `size`.
   SVG can't hold text here, so the letters sit on top as positioned HTML. */
function laurel() {
  const parts = [];
  for (const side of [-1, 1]) {
    const ex = (100 + side * 58 * Math.sin(2.72)).toFixed(1), ey = (100 + 58 * Math.cos(2.72)).toFixed(1);
    parts.push(<path key={`s${side}`} d={`M100 158A58 58 0 0 ${side < 0 ? 1 : 0} ${ex} ${ey}`} fill="none" stroke={C.gold} strokeWidth="1" strokeLinecap="round" />);
    for (let j = 0; j < 10; j++) {
      const a = (14 + j * 14.4) * Math.PI / 180, out = j % 2 ? 61.5 : 54.5;
      const x = (100 + side * out * Math.sin(a)).toFixed(1), y = (100 + out * Math.cos(a)).toFixed(1);
      const rot = (-side * (a * 57.296) + side * (j % 2 ? 62 : 118)).toFixed(0);
      parts.push(<path key={`l${side}${j}`} transform={`translate(${x} ${y}) rotate(${rot})`} d="M0 -5.6Q2.9 0 0 5.6Q-2.9 0 0 -5.6Z" fill="url(#gold)" />);
    }
  }
  return parts;
}

/* One initial; (cx, baseline) are in the 200-grid. Bodoni's baseline sits 0.8625em below the top of a line-height:1 box.
   layer: "ink" = upright R; "halo" + "gold" = italic F with a cream outline behind it, so it reads as laced over the R.
   simple (icons): sturdier cut and a solid deep gold, since the sheen and hairlines vanish at 16px. */
const layerStyle = (layer, k, simple) =>
  layer === "ink" ? { color: C.ink }
  : layer === "halo" ? { color: C.cream, fontStyle: "italic", WebkitTextStroke: `${(simple ? 9 : 6) * k}px ${C.cream}` }
  : simple ? { color: "#a07c3c", fontStyle: "italic" }
  : { color: "transparent", fontStyle: "italic", backgroundImage: GOLD_SHEEN, backgroundClip: "text" };

function Initial({ ch, cx, baseline, fontSize, layer, k, simple }) {
  return (
    <div style={{ position: "absolute", left: (cx - 60) * k, top: (baseline - 0.8625 * fontSize) * k, width: 120 * k,
      display: "flex", justifyContent: "center", fontFamily: simple ? "BodoniSmall" : "Bodoni", fontWeight: simple ? 700 : 400,
      fontSize: fontSize * k, lineHeight: 1, ...layerStyle(layer, k, simple) }}>
      {ch}
    </div>
  );
}

export function Crest({ size, simple = false }) {
  const k = size / 200;
  return (
    <div style={{ position: "relative", display: "flex", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <linearGradient id="gold" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="200" y2="160">
            <stop offset="0" stopColor="#9c7c42" /><stop offset=".45" stopColor="#c5a567" /><stop offset=".5" stopColor="#efdfb0" />
            <stop offset=".55" stopColor="#c5a567" /><stop offset="1" stopColor="#9c7c42" />
          </linearGradient>
        </defs>
        {simple ? [
          <circle key="d" cx="100" cy="100" r="98" fill={C.cream} />,
          <circle key="r" cx="100" cy="100" r="90" fill="none" stroke="url(#gold)" strokeWidth="7" />,
        ] : [
          <circle key="r1" cx="100" cy="100" r="97" fill="none" stroke={C.gold} strokeWidth="1.1" />,
          <circle key="bd" cx="100" cy="100" r="92.5" fill="none" stroke={C.gold} strokeWidth="2.1" strokeLinecap="round" strokeDasharray=".1 7.92" />,
          <circle key="r2" cx="100" cy="100" r="73" fill="none" stroke={C.gold} strokeWidth=".8" />,
          <circle key="tk" cx="100" cy="100" r="69.5" fill="none" stroke={C.gold} strokeWidth="3.4" strokeDasharray=".55 4.74" opacity=".65" />,
          ...laurel(),
          <rect key="s1" x="97" y="39" width="6" height="6" fill="url(#gold)" />,
          <rect key="s2" x="97" y="39" width="6" height="6" fill="url(#gold)" transform="rotate(45 100 42)" />,
          <circle key="dt" cx="100" cy="158" r="1.8" fill="url(#gold)" />,
        ]}
      </svg>
      {["ink", "halo", "gold"].map((layer) => {
        const [R, F] = simple
          ? [{ cx: 80, baseline: 136, fontSize: 108 }, { cx: 124, baseline: 152, fontSize: 108 }]
          : [{ cx: 88, baseline: 118, fontSize: 66 }, { cx: 117, baseline: 130, fontSize: 66 }];
        return layer === "ink"
          ? <Initial key={layer} ch={CONFIG.initials[0]} {...R} layer={layer} k={k} simple={simple} />
          : <Initial key={layer} ch={CONFIG.initials[1]} {...F} layer={layer} k={k} simple={simple} />;
      })}
    </div>
  );
}

/* ---------- icons ---------- */
export function iconImage({ width, height }, { square = false } = {}) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: square ? C.cream : "transparent" }}>
      {square ? <Crest size={width * 0.92} /> : <Crest size={width} simple />}
    </div>,
    { width, height, fonts: MONO_FONTS },
  );
}

/* ---------- the share card (1200×630) ---------- */
const label = (fontSize) => ({ fontFamily: "Cormorant", fontWeight: 500, fontSize, letterSpacing: fontSize * 0.3, color: C.muted, textTransform: "uppercase" });
const nameStyle = { fontFamily: "Cormorant", fontSize: 64, letterSpacing: 64 * 0.07, lineHeight: 1.1, color: C.ink, textTransform: "uppercase" };
const rule = { width: 86, height: 1, background: C.ink, opacity: 0.5 };

// Names outside the script font's alphabet (e.g. written in Devanagari) would print as empty boxes — show the general card then.
const printable = (name) => /^[\p{Script=Latin}\p{M}\p{N} .&'’]+$/u.test(name);

function Card({ guest }) {
  const forGuest = guest && printable(guest);
  const guestSize = Math.min(62, Math.floor(880 / (guest.length * 0.36)));   // shrink long names to one line
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: C.ground, backgroundImage: "radial-gradient(circle at 50% 35%, #ebe2d0 0%, #ddd0b8 75%)" }}>
      <div style={{ position: "relative", width: 1140, height: 570, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", backgroundColor: C.cream, borderRadius: 30, boxShadow: "0 16px 40px rgba(85,62,25,.28)" }}>
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, bottom: 16, border: `1px solid ${C.gold}`, borderRadius: 20 }} />
        <div style={{ position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: `1px solid ${C.goldLight}`, borderRadius: 16 }} />

        <Crest size={forGuest ? 124 : 160} />
        {forGuest ? [
          // words set apart by hand: the script font's own space is too narrow
          <div key="g" style={{ display: "flex", fontFamily: "Script", fontSize: guestSize, color: C.gold, lineHeight: 1.15, marginTop: 12 }}>
            {guest.split(" ").map((word, i) => <span key={i} style={{ margin: `0 ${guestSize * 0.13}px` }}>{word}</span>)}
          </div>,
          <div key="l" style={{ ...label(17), marginTop: 2 }}>you are invited to the wedding of</div>,
        ] : (
          <div style={{ ...label(19), marginTop: 10 }}>Wedding Invitation</div>
        )}
        <div style={{ ...nameStyle, marginTop: forGuest ? 10 : 14 }}>{CONFIG.groom}</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={rule} />
          <div style={{ fontFamily: "Script", fontSize: 64, color: C.gold, lineHeight: 1, margin: "0 18px", paddingTop: 8 }}>and</div>
          <div style={rule} />
        </div>
        <div style={nameStyle}>{CONFIG.bride}</div>
        <div style={{ fontFamily: "Cormorant", fontSize: 28, letterSpacing: 28 * 0.22, color: C.ink, marginTop: 14 }}>{DOT_DATE}</div>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };
export const ogImage = (guest = "") => new ImageResponse(<Card guest={guest} />, { ...OG_SIZE, fonts: ALL_FONTS });
