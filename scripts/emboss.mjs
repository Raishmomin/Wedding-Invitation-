/* Makes the artwork for the envelope, lit once here because lighting is too slow for phones:

     public/emboss/ornament-top|bottom.webp   baroque scrollwork pressed into the top and bottom flaps
     public/emboss/ornament-left|right.webp   tall scrollwork for the two side flaps
     public/emboss/badge.webp                 the wax seal, with our initials pressed into it
     public/emboss/pendant.webp               the drop that hangs from it: gold cord, a pearl, a silk feather
     public/paper.webp                        the same scrollwork as an all-over damask, behind the cards

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

function petal(x, y, deg, L, w = L * .26){
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">
    <path d="M0 0C${f(L*.3)} ${f(-w)} ${f(L*.72)} ${f(-w*.9)} ${f(L)} 0C${f(L*.72)} ${f(w*.9)} ${f(L*.3)} ${f(w)} 0 0Z" fill="url(#ridge)" stroke="#6a6a6a" stroke-width=".7"/>
    <path d="M${f(L*.12)} 0H${f(L*.84)}" stroke="${GROOVE}" stroke-width="1.1" stroke-linecap="round"/></g>`;
}
const bead = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#dome)" stroke="#5a5a5a" stroke-width=".6"/>`;

/* A raised ribbon: curved legs, then a curl that keeps turning the way it was heading (turn: 1 clockwise,
   -1 anticlockwise) and winds in from radius R to a bead.
   feather: small leaves along one side of the legs (side: 1 right of travel, -1 left; from/to: share of the length),
   which is what makes a scroll read as acanthus. */
function ribbon(start, legs, { turn = 0, R = 16, turns = 1.2, end = 3.5, w = 5, feather } = {}){
  let pts = [start], knob = "", leaves = "";
  for(const [c1, c2, p] of legs) pts = pts.concat(bez(pts[pts.length - 1], c1, c2, p));
  if(feather){
    const { side, from = .1, to = .6, every = 11, len = 15 } = feather;
    const run = [0]; for(let i = 1; i < pts.length; i++) run.push(run[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = run[run.length - 1];
    for(let d = from * total; d <= to * total; d += every){
      const i = Math.max(1, run.findIndex(v => v >= d)), [x, y] = pts[i], [px, py] = pts[i - 1];
      const along = (d / total - from) / (to - from);   // leaves shrink toward the curl
      const L = len * (1 - .3 * along);
      leaves += petal(x, y, (Math.atan2(y - py, x - px) + side * .95) * 57.296, L, L * .34);
    }
  }
  if(turn){
    const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 3];
    const th = Math.atan2(y - py, x - px), cx = x - Math.sin(th) * turn * R, cy = y + Math.cos(th) * turn * R;
    const a0 = Math.atan2(y - cy, x - cx), total = turns * 6.283, k = Math.log(R / end) / total;
    for(let phi = .12; phi <= total; phi += .12){ const rr = R * Math.exp(-k * phi), a = a0 + turn * phi; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    const [ex, ey] = pts[pts.length - 1];
    knob = `<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(w * .8)}" fill="url(#dome)"/>`;
  }
  const d = pts.map(([x, y], i) => (i ? "L" : "M") + f(x) + " " + f(y)).join("");
  const line = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;   // a wide low band with a narrow high crest = a rounded ridge
  return `${leaves}<path d="${d}" ${line} stroke="#8e8e8e" stroke-width="${w}"/><path d="${d}" ${line} stroke="#cdcdcd" stroke-width="${f(w * .42)}"/>${knob}`;
}

/* The damask for the top flap: drawn for the right of the centre line and mirrored. It fills a triangle,
   corner to corner at the top and narrowing to a point, so it sits inside the flap; flipped, it points up
   for the bottom flap. Fits a 420×330 box. */
function damask(W, H, flip){
  const half = [
    // heart: from the foot, out and up, curling in over the top
    ribbon([5, 236], [[[38, 230], [80, 202], [80, 164]], [[80, 130], [58, 106], [34, 110]]], { turn: -1, R: 18, w: 7, feather: { side: 1, from: .08, to: .36, len: 16 } }),
    // great volute: springs from the heart's flank, sweeps out and rolls in under the shoulder
    ribbon([84, 156], [[[116, 156], [142, 130], [144, 98]], [[146, 72], [134, 52], [116, 54]]], { turn: -1, R: 22, turns: 1.35, w: 7, feather: { side: 1, from: .04, to: .4, len: 16 } }),
    // wing: leaves the volute's back for the top corner and rolls in
    ribbon([144, 104], [[[160, 94], [174, 74], [174, 52]], [[174, 34], [164, 18], [150, 22]]], { turn: -1, R: 12, w: 5.8, feather: { side: -1, from: .12, to: .5, len: 13 } }),
    // crown scroll: rises beside the centre line and rolls out over the heart
    ribbon([14, 96], [[[18, 68], [44, 44], [76, 44]]], { turn: 1, R: 15, w: 6, feather: { side: -1, from: .3, to: .92, len: 16 } }),
    // offshoot from the heart, curling down and back
    ribbon([78, 176], [[[92, 180], [104, 192], [100, 206]]], { turn: 1, R: 9, w: 5 }),
    // foot: a small curl either side of the finial
    ribbon([9, 250], [[[22, 250], [36, 256], [38, 268]]], { turn: 1, R: 8, w: 4.8 }),
    // acanthus between the heart and the volute, and a palmette growing from the volute's crown
    petal(82, 150, -105, 36, 10), petal(87, 148, -62, 25, 7.5),
    petal(118, 52, -90, 28, 7), petal(118, 52, -124, 21, 6), petal(118, 52, -56, 21, 6),
    petal(0, 214, -58, 42, 11), petal(0, 246, 48, 22, 6.5), petal(0, 78, -58, 38, 10),
  ].join("");
  const axis = [
    petal(0, 214, -90, 58, 9.5), bead(0, 225, 5),               // lily inside the heart
    petal(0, 246, 90, 66, 13),                                  // finial: the point of the ornament
    petal(0, 78, -90, 56, 8.5), bead(0, 90, 4.6), bead(0, 104, 3),
  ].join("");
  const art = `<g transform="translate(${W / 2} 6)">${half}<g transform="scale(-1 1)">${half}</g>${axis}</g>`;
  return flip ? `<g transform="translate(0 ${H}) scale(1 -1)">${art}</g>` : art;
}

/* The side flap's ornament: a vine of scrolls running down from the centre line, mirrored above it, with a
   palmette on the line pointing at the seal. Drawn for the left flap (fits 130×560); mirrored for the right. */
function sideDamask(W, H, mirror){
  const lower = [
    ribbon([12, 16], [[[36, 20], [70, 40], [74, 72]], [[76, 96], [60, 112], [44, 104]]], { turn: 1, R: 14, w: 6.6, feather: { side: -1, from: .22, to: .6, len: 17 } }),
    ribbon([70, 100], [[[84, 124], [80, 156], [58, 170]], [[40, 182], [20, 172], [22, 152]]], { turn: 1, R: 14, w: 6, feather: { side: -1, from: .08, to: .5, len: 16 } }),
    ribbon([52, 176], [[[64, 198], [58, 226], [40, 238]], [[28, 246], [14, 238], [16, 224]]], { turn: 1, R: 10, w: 5.4, feather: { side: -1, from: .08, to: .5, len: 15 } }),
    petal(30, 246, 78, 24),
    petal(26, 0, 26, 40),
  ].join("");
  const axis = [petal(26, 0, 0, 70, 10), bead(15, 0, 5.2), bead(104, 0, 3.6)].join("");
  const art = `<g transform="translate(4 ${H / 2})">${lower}<g transform="scale(1 -1)">${lower}</g>${axis}</g>`;
  return mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${art}</g>` : art;
}

/* ---------- the wax seal (on a 200-grid): champagne wax with an uneven edge and a rounded lip, a pressed
   plate with a raised ring inside it, and the initials standing up from the plate ---------- */
function seal(){
  const [a, b] = CONFIG.initials;
  const font = `font-family="Bodoni Moda" font-weight="700" font-size="80" text-anchor="middle"`;   // the sturdy cut: hairlines survive
  let edge = "";
  for(let i = 0; i <= 160; i++){
    const t = i / 160 * 6.2832, rr = 90 + 3.2 * Math.sin(5 * t + .6) + 2.2 * Math.sin(8 * t + 2.1) + 1.2 * Math.sin(13 * t + .9);
    edge += (i ? "L" : "M") + f(100 + rr * Math.cos(t)) + " " + f(100 + rr * Math.sin(t));
  }
  const PLATE = "#7e7e7e";
  return `<clipPath id="under"><text x="84" y="129" ${font}>${a}</text></clipPath>
    <path d="${edge}Z" fill="url(#lip)"/>
    <circle cx="100" cy="100" r="68" fill="${PLATE}"/>
    <circle cx="100" cy="100" r="61" fill="none" stroke="#b4b4b4" stroke-width="3"/>
    <text x="84" y="129" ${font} fill="#b8b8b8">${a}</text>
    <text x="121" y="143" ${font} font-style="italic" fill="none" stroke="${PLATE}" stroke-width="3.6" stroke-linejoin="round" clip-path="url(#under)">${b}</text>
    <text x="121" y="143" ${font} font-style="italic" fill="#c4c4c4">${b}</text>`;
}

/* ---------- its pendant (on a 76×124 grid): three silk petals, their gilt edges, a pearl, and the gold cord and beads ---------- */
const PETALS = ["M38 46C30 54 8 76 12 110C22 104 28 96 32 86C38 72 40 58 38 46Z", "M38 46C46 54 68 76 64 110C54 104 48 96 44 86C38 72 36 58 38 46Z",
  "M38 46C52 64 54 96 40 122C36 112 34 104 30 96C24 80 28 62 38 46Z"];
const FEATHER = PETALS.map(d => `<path d="${d}" fill="url(#ridgeX)" stroke="#555" stroke-width="1"/>`).join("");
const GILT = `<g fill="none" stroke="#c2a05e" stroke-width=".6" stroke-linecap="round" opacity=".75">${PETALS.map(d => `<path d="${d}"/>`).join("")}
  <path d="M38 52C42 76 43 98 40 116M37 52C31 70 20 88 15 104M39 52C45 70 56 88 61 104"/></g>`;
const PEARL = `<circle cx="38" cy="31.5" r="9.2" fill="url(#ball)"/>`;
const CORD = `<path d="M38 0V18" stroke="#9a9a9a" stroke-width="2.2"/><path d="M38 0V18" stroke="#d6d6d6" stroke-width=".9"/>
  <circle cx="38" cy="19.4" r="3.5" fill="url(#ball)"/><circle cx="38" cy="43.6" r="3.7" fill="url(#ball)"/>`;

/* ---------- lighting ---------- */
const sun = `<feDistantLight azimuth="225" elevation="50"/>`;   // from the top left
const DEFS = `
  <radialGradient id="dome" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d8d8d8"/><stop offset=".72" stop-color="#ababab"/><stop offset="1" stop-color="#8a8a8a"/></radialGradient>
  <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#c4c4c4"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient>
  <linearGradient id="ridgeX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a8a8a"/><stop offset=".5" stop-color="#dadada"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient>
  <radialGradient id="lip"><stop offset="0" stop-color="#b0b0b0"/><stop offset=".76" stop-color="#b4b4b4"/><stop offset=".88" stop-color="#d6d6d6"/><stop offset="1" stop-color="#909090"/></radialGradient>
  <radialGradient id="ball"><stop offset="0" stop-color="#f0f0f0"/><stop offset=".6" stop-color="#cfcfcf"/><stop offset="1" stop-color="#5a5a5a"/></radialGradient>`;
const box = (W, H) => `filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB"`;
const KD = .5 / Math.sin(50 * Math.PI / 180);   // flat paper lights to exactly mid-grey…
// a whisper of fine noise in the height: without it, gentle slopes light up as contour rings
const GRAIN = `<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .01 0 0 0 0" result="grain"/>`;

const LIGHT = {
  // …so that, on a transparent ground, only what rises or falls shows: light above mid-grey, shade below it
  pressed: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="${KD.toFixed(4)}" lighting-color="#fff" result="lit">${sun}</feDiffuseLighting>
    <feColorMatrix in="lit" type="matrix" values="0 0 0 0 1  0 0 0 0 .99  0 0 0 0 .96  4 0 0 0 -2.04" result="hi"/>
    <feColorMatrix in="lit" type="matrix" values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .15  -1.7 0 0 0 .83" result="sh"/>
    <feMerge><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
  </filter>`,
  // the opaque paper behind the cards: lit cream stock with a satin sheen and fine tooth
  paper: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.2" result="shape"/>
    <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .016 0 0 0 0" result="tooth"/>
    <feComposite in="shape" in2="tooth" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="1.27" lighting-color="#f2eadd" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="3.5" specularConstant=".5" specularExponent="26" lighting-color="#fffbf2" result="sheen">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="sheen" operator="arithmetic" k2="1" k3=".3"/>
  </filter>`,
  // satin sealing wax in the envelope's own champagne, cut to its outline; what stands higher is a touch paler,
  // so the lip and the initials read against the pressed plate
  wax: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.3" result="shape"/>
    ${GRAIN}
    <feComposite in="shape" in2="grain" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="7" diffuseConstant="1.12" lighting-color="#e0c594" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="7" specularConstant=".35" specularExponent="18" lighting-color="#fff8e8" result="shine">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="shine" operator="arithmetic" k2="1" k3="1" result="lit"/>
    <feColorMatrix in="shape" type="matrix" values="0 0 0 0 1  0 0 0 0 .955  0 0 0 0 .84  0 0 0 1.6 -.78" result="pale"/>
    <feMerge result="toned"><feMergeNode in="lit"/><feMergeNode in="pale"/></feMerge>
    <feComposite in="toned" in2="SourceAlpha" operator="in"/>
  </filter>`,
  // glossy ivory (the pearl, the silk), cut to its own outline
  pearl: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.2" result="shape"/>
    ${GRAIN}
    <feComposite in="shape" in2="grain" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="7" diffuseConstant="1.27" lighting-color="#fbf5ea" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="7" specularConstant=".4" specularExponent="34" lighting-color="#fff" result="shine">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="shine" operator="arithmetic" k2="1" k3="1" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in"/>
  </filter>`,
  // silk: soft, matte, a little see-through
  silk: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.6" result="shape"/>
    ${GRAIN}
    <feComposite in="shape" in2="grain" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="3.2" diffuseConstant="1.26" lighting-color="#f7efdf" result="matte">${sun}</feDiffuseLighting>
    <feComposite in="matte" in2="SourceAlpha" operator="in"/>
    <feComponentTransfer><feFuncA type="linear" slope=".93"/></feComponentTransfer>
  </filter>`,
  // polished gold, cut to its own outline, with the soft shadow it casts on whatever lies beneath
  gold: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="6" diffuseConstant="1.1" lighting-color="#d4a548" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="6" specularConstant=".6" specularExponent="22" lighting-color="#fff0bd" result="shine">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="shine" operator="arithmetic" k2="1" k3="1" result="metal"/>
    <feComposite in="metal" in2="SourceAlpha" operator="in" result="cut"/>
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/><feOffset dx="1.4" dy="2.2" result="cast"/>
    <feFlood flood-color="#4a330c" flood-opacity=".34"/><feComposite in2="cast" operator="in" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="cut"/></feMerge>
  </filter>`,
};
const NEEDS_GROUND = new Set(["pressed", "paper"]);   // these light the whole sheet, so it starts as flat black (height 0)

/* layers: [light, art] pairs, bottom first ("plain" = drawn as it is, unlit); art is drawn on a W×H grid and the picture comes out `scale` times that */
async function render(file, W, H, layers, { scale = 2, quality = 88 } = {}){
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${DEFS}${layers.map(([light], i) => LIGHT[light]?.(W, H, `l${i}`) ?? "").join("")}</defs>
    ${layers.map(([light, art], i) => `<g ${LIGHT[light] ? `filter="url(#l${i})"` : ""}>${NEEDS_GROUND.has(light) ? `<rect width="${W}" height="${H}" fill="#000"/>` : ""}${art}</g>`).join("")}</svg>`;
  const out = join(root, "public", file);
  const info = await sharp(Buffer.from(svg), { density: 72 * scale }).webp({ quality, alphaQuality: 92 }).toFile(out);
  console.log(`public/${file}`.padEnd(36), `${info.width}×${info.height}`.padEnd(10), `${Math.round(info.size / 1024)} KB`);
}

/* ---------- the pieces ---------- */
mkdirSync(join(root, "public/emboss"), { recursive: true });

await render("emboss/ornament-top.webp", 420, 330, [["pressed", damask(420, 330, false)]]);
await render("emboss/ornament-bottom.webp", 420, 330, [["pressed", damask(420, 330, true)]]);
await render("emboss/ornament-left.webp", 130, 560, [["pressed", sideDamask(130, 560, false)]]);
await render("emboss/ornament-right.webp", 130, 560, [["pressed", sideDamask(130, 560, true)]]);
await render("emboss/badge.webp", 200, 200, [["wax", seal()]], { scale: 2.04, quality: 92 });   // shown at 136px, drawn 3×
await render("emboss/pendant.webp", 76, 124, [["silk", FEATHER], ["plain", GILT], ["pearl", PEARL], ["gold", CORD]], { scale: 2.4, quality: 92 });

// behind the cards: the same scrollwork as a damask repeat, each column dropped half a step
{
  const W = 600, H = 1000, k = .62;
  let all = "";
  for(let col = 0; col < 3; col++) for(let row = -1; row < 5; row++){
    const x = col * 300, y = row * 250 + (col % 2 ? 125 : 0) + 60;
    all += `<g transform="translate(${f(x - 210 * k)} ${f(y - 165 * k)}) scale(${k})">${damask(420, 330, (row + col) % 2 === 0)}</g>`;
  }
  await render("paper.webp", W, H, [["paper", all]], { quality: 82 });
}
