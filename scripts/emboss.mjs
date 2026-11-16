/* Makes the artwork for the envelope, lit once here because lighting is too slow for phones:

     public/emboss/ornament-top.webp      baroque scrollwork pressed into the top flap
     public/emboss/ornament-bottom.webp   the same, pointing up, on the lower flap
     public/emboss/emblem.webp            our crest (the initials in a laurel) as raised gold: the button that opens it
     public/paper.webp                    the same scrollwork as an all-over damask, behind the cards

   Run it again after changing anything here or the initials in lib/config.js:   npm run emboss

   Each piece is drawn as a height map (brighter = higher) and lit from the top left. The scrollwork keeps
   only its light and shade, on a transparent ground, so it sits on the paper colour set in globals.css. */
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONFIG } from "../lib/config.js";

const root = fileURLToPath(new URL("..", import.meta.url));
// let the SVG renderer find the invitation's Bodoni for the monogram
const fontsConf = join(tmpdir(), "wedding-invite-fonts.conf");
writeFileSync(fontsConf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${join(root, "assets/fonts")}</dir></fontconfig>`);
process.env.FONTCONFIG_FILE = fontsConf;
const { default: sharp } = await import("sharp");

const f = n => n.toFixed(1);
const GROOVE = "#555";

/* ---------- baroque scrollwork ---------- */
const bez = (p0, c1, c2, p1, n = 22) => Array.from({ length: n }, (_, i) => {
  const t = (i + 1) / n, u = 1 - t;
  return [0, 1].map(k => u*u*u*p0[k] + 3*u*u*t*c1[k] + 3*u*t*t*c2[k] + t*t*t*p1[k]);
});

/* A raised ribbon: curved legs, then a curl that keeps turning the way it was heading (turn: 1 clockwise,
   -1 anticlockwise) and winds in from radius R to a bead. */
function ribbon(start, legs, { turn = 0, R = 16, turns = 1.2, end = 3.5, w = 5 } = {}){
  let pts = [start], bead = "";
  for(const [c1, c2, p] of legs) pts = pts.concat(bez(pts[pts.length - 1], c1, c2, p));
  if(turn){
    const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 3];
    const th = Math.atan2(y - py, x - px), cx = x - Math.sin(th) * turn * R, cy = y + Math.cos(th) * turn * R;
    const a0 = Math.atan2(y - cy, x - cx), total = turns * 6.283, k = Math.log(R / end) / total;
    for(let phi = .12; phi <= total; phi += .12){ const rr = R * Math.exp(-k * phi), a = a0 + turn * phi; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    const [ex, ey] = pts[pts.length - 1];
    bead = `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(w * .8)}" fill="url(#dome)"/>`;
  }
  const d = pts.map(([x, y], i) => (i ? "L" : "M") + f(x) + " " + f(y)).join("");
  const line = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;   // a wide low band with a narrow high crest = a rounded ridge
  return `<path d="${d}" ${line} stroke="#8e8e8e" stroke-width="${w}"/><path d="${d}" ${line} stroke="#cdcdcd" stroke-width="${f(w * .42)}"/>${bead}`;
}

function petal(x, y, deg, L, w = L * .26){
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">
    <path d="M0 0C${f(L*.3)} ${f(-w)} ${f(L*.72)} ${f(-w*.9)} ${f(L)} 0C${f(L*.72)} ${f(w*.9)} ${f(L*.3)} ${f(w)} 0 0Z" fill="url(#ridge)" stroke="#6a6a6a" stroke-width=".7"/>
    <path d="M${f(L*.12)} 0H${f(L*.84)}" stroke="${GROOVE}" stroke-width="1.1" stroke-linecap="round"/></g>`;
}
const bead = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#dome)" stroke="#5a5a5a" stroke-width=".6"/>`;

/* The damask: drawn for the right of the centre line and mirrored. Broad at the top and narrowing to a point,
   so it sits inside the flap's V; flipped, it points up for the lower flap. Fits a 420×320 box. */
function damask(W, H, flip){
  const half = [
    // heart: from the foot, out and up, curling in over the top
    ribbon([5, 226], [[[40, 220], [84, 190], [82, 148]], [[80, 112], [56, 88], [32, 92]]], { turn: -1, R: 19, w: 6.6 }),
    // great scroll: springs from the heart's flank, sweeps wide and curls in at the shoulder
    ribbon([66, 196], [[[100, 204], [152, 180], [162, 128]], [[168, 84], [146, 44], [114, 48]]], { turn: -1, R: 23, turns: 1.3, w: 6.6 }),
    // wing: leaves the great scroll's back for the top corner and curls in
    ribbon([160, 132], [[[178, 114], [192, 86], [188, 60]], [[185, 38], [174, 22], [158, 26]]], { turn: -1, R: 13, w: 5.4 }),
    // tendril inside the great scroll
    ribbon([152, 152], [[[140, 142], [124, 130], [119, 113]]], { turn: 1, R: 9, w: 4.4 }),
    // offshoot from the great scroll, curling down and back
    ribbon([134, 184], [[[152, 188], [168, 202], [166, 222]]], { turn: 1, R: 12, w: 5 }),
    // under-scroll: from the heart's flank, out and up
    ribbon([46, 218], [[[68, 234], [96, 248], [112, 236]]], { turn: -1, R: 11, w: 5 }),
    // crown: rises beside the centre line and curls outward
    ribbon([11, 78], [[[12, 50], [32, 26], [56, 30]]], { turn: 1, R: 13, w: 5 }),
    // foot: a small curl either side of the finial
    ribbon([9, 240], [[[26, 240], [44, 248], [46, 262]]], { turn: 1, R: 9, w: 4.6 }),
    // acanthus touches
    petal(86, 146, -72, 34), petal(98, 158, -38, 24), petal(190, 58, -52, 24), petal(182, 100, -14, 22),
    petal(150, 196, 62, 22), petal(74, 214, 96, 20),
    petal(0, 204, -56, 44), petal(0, 236, 50, 28), petal(0, 60, -58, 30),
  ].join("");
  const axis = [
    petal(0, 204, -90, 62, 9), bead(0, 215, 5),              // lily inside the heart
    petal(0, 236, 90, 66, 14),                               // finial: the point of the ornament
    petal(0, 60, -90, 48, 7), bead(0, 74, 4.4), bead(0, 88, 3),
  ].join("");
  const art = `<g transform="translate(${W / 2} 6)">${half}<g transform="scale(-1 1)">${half}</g>${axis}</g>`;
  return flip ? `<g transform="translate(0 ${H}) scale(1 -1)">${art}</g>` : art;
}

/* ---------- our crest, for the gold emblem: the laurel and initials of the monogram, drawn on its 200-grid ---------- */
function crest(){
  const [a, b] = CONFIG.initials;
  const font = `font-family="Bodoni Moda" font-weight="700" font-size="68" text-anchor="middle"`;   // the sturdy cut: hairlines survive
  let wreath = "";
  for(const side of [-1, 1]){
    wreath += `<path d="M100 159A59 59 0 0 ${side < 0 ? 1 : 0} ${f(100 + side * 59 * Math.sin(2.72))} ${f(100 + 59 * Math.cos(2.72))}" fill="none" stroke="#a8a8a8" stroke-width="3.2" stroke-linecap="round"/>`;
    for(let j = 0; j < 10; j++){
      const an = (14 + j * 14.4) * Math.PI / 180, out = j % 2 ? 63 : 53.5;
      const x = 100 + side * out * Math.sin(an), y = 100 + out * Math.cos(an), rot = -side * (an * 57.296) + side * (j % 2 ? 62 : 118);
      wreath += `<path transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" d="M0 -8.2Q4.6 0 0 8.2Q-4.6 0 0 -8.2Z" fill="url(#ridgeX)"/>`;
    }
  }
  return `<g transform="translate(100 100) scale(1.3) translate(-100 -100)">
    <clipPath id="under"><text x="87" y="122" ${font}>${a}</text></clipPath>
    ${wreath}
    <rect x="96.5" y="38" width="7" height="7" fill="#d0d0d0" transform="rotate(45 100 41.5)"/>
    <circle cx="100" cy="159" r="2.6" fill="#d0d0d0"/>
    <text x="87" y="122" ${font} fill="#c2c2c2">${a}</text>
    <text x="119" y="135" ${font} font-style="italic" fill="none" stroke="#3a3a3a" stroke-width="3.2" stroke-linejoin="round" clip-path="url(#under)">${b}</text>
    <text x="119" y="135" ${font} font-style="italic" fill="#d8d8d8">${b}</text>
  </g>`;
}

/* ---------- lighting ---------- */
const sun = `<feDistantLight azimuth="225" elevation="50"/>`;   // from the top left
const DEFS = `
  <radialGradient id="dome" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d8d8d8"/><stop offset=".72" stop-color="#ababab"/><stop offset="1" stop-color="#8a8a8a"/></radialGradient>
  <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#c4c4c4"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient>
  <linearGradient id="ridgeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8a8a"/><stop offset=".5" stop-color="#dadada"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient>`;
const box = (W, H) => `filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB"`;
const KD = .5 / Math.sin(50 * Math.PI / 180);   // flat paper lights to exactly mid-grey…

const LIGHT = {
  // …so that, on a transparent ground, only what rises or falls shows: light above mid-grey, shade below it
  pressed: (W, H) => `<filter id="light" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="${KD.toFixed(4)}" lighting-color="#fff" result="lit">${sun}</feDiffuseLighting>
    <feColorMatrix in="lit" type="matrix" values="0 0 0 0 1  0 0 0 0 .99  0 0 0 0 .96  4 0 0 0 -2.04" result="hi"/>
    <feColorMatrix in="lit" type="matrix" values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .15  -1.7 0 0 0 .83" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
  </filter>`,
  // the opaque paper behind the cards: lit cream stock with a satin sheen and fine tooth
  paper: (W, H) => `<filter id="light" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.2" result="shape"/>
    <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .016 0 0 0 0" result="tooth"/>
    <feComposite in="shape" in2="tooth" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="1.27" lighting-color="#f2eadd" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="3.5" specularConstant=".5" specularExponent="26" lighting-color="#fffbf2" result="sheen">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="sheen" operator="arithmetic" k2="1" k3=".3"/>
  </filter>`,
  // polished gold, cut to the shape itself (no ground): warm body colour plus a bright highlight on the lit bevels
  gold: (W, H) => `<filter id="light" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="6" diffuseConstant="1.1" lighting-color="#d4a548" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="6" specularConstant=".6" specularExponent="22" lighting-color="#fff0bd" result="shine">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="shine" operator="arithmetic" k2="1" k3="1" result="metal"/>
    <feComposite in="metal" in2="SourceAlpha" operator="in"/>
  </filter>`,
};

/* art is drawn on a W×H grid; the picture comes out `scale` times that in pixels */
async function render(file, W, H, art, { light = "pressed", scale = 2, quality = 88 } = {}){
  const ground = light === "gold" ? "" : `<rect width="${W}" height="${H}" fill="#000"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${DEFS}${LIGHT[light](W, H)}</defs>
    <g filter="url(#light)">${ground}${art}</g></svg>`;
  const out = join(root, "public", file);
  const info = await sharp(Buffer.from(svg), { density: 72 * scale }).webp({ quality, alphaQuality: 92 }).toFile(out);
  console.log(`public/${file}`.padEnd(34), `${info.width}×${info.height}`.padEnd(10), `${Math.round(info.size / 1024)} KB`);
}

/* ---------- the pieces ---------- */
mkdirSync(join(root, "public/emboss"), { recursive: true });

await render("emboss/ornament-top.webp", 420, 320, damask(420, 320, false));
await render("emboss/ornament-bottom.webp", 420, 320, damask(420, 320, true));
await render("emboss/emblem.webp", 200, 200, crest(), { light: "gold", scale: 1.92 });   // shown at 128px, drawn 3×

// behind the cards: the same scrollwork as a damask repeat, each column dropped half a step
{
  const W = 600, H = 1000, k = .62;
  let all = "";
  for(let col = 0; col < 3; col++) for(let row = -1; row < 5; row++){
    const x = col * 300, y = row * 250 + (col % 2 ? 125 : 0) + 60;
    all += `<g transform="translate(${f(x - 210 * k)} ${f(y - 160 * k)}) scale(${k})">${damask(420, 320, (row + col) % 2 === 0)}</g>`;
  }
  await render("paper.webp", W, H, all, { light: "paper", quality: 82 });
}
