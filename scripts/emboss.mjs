/* Makes the artwork for the envelope, lit once here because lighting is too slow for phones:

     public/emboss/leaves-*.webp     leafy branches pressed into the flaps (top-left, top-right, left, right, bottom)
     public/emboss/badge.webp        the wax seal, with our initials pressed into it
     public/emboss/pendant.webp      the drop that hangs from it: gold cord, a pearl, a silk feather
     public/paper.webp               the same leaves scattered all over, behind the cards

   Run it again after changing anything here or the initials in lib/config.js:   npm run emboss

   Each piece is drawn as a height map (brighter = higher) and lit from the top left. The leaves keep only
   their light and shade, on a transparent ground, so they sit on the paper colour set in globals.css. */
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

function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f = n => n.toFixed(1);
const GROOVE = "#555", VEIN = "#767676", STEM = "#8c8c8c";

/* ---------- embossed botanicals ---------- */
/* A leaf lying along +x from its stalk: a low dome with a pressed midrib and side veins. `sway` bends its tip. */
function leaf(r, x, y, deg, L, sway = 0){
  const w = L * (.25 + r() * .06), c = sway * L;
  let veins = "";
  for(let k = 1; k <= 4; k++){
    const t = k / 5.2, x0 = L * t, y0 = c * t * t, reach = w * .7 * (1 - t * .55);
    veins += `M${f(x0)} ${f(y0)}L${f(x0 + L * .13)} ${f(y0 - reach)}M${f(x0)} ${f(y0)}L${f(x0 + L * .13)} ${f(y0 + reach)}`;
  }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">
    <path d="M0 0C${f(L*.26)} ${f(-w*1.05)} ${f(L*.66)} ${f(-w*.9 + c*.55)} ${f(L)} ${f(c)}C${f(L*.7)} ${f(w*.82 + c*.55)} ${f(L*.3)} ${f(w)} 0 0Z" fill="url(#ridge)" stroke="#6a6a6a" stroke-width=".7"/>
    <path d="M${f(L*.03)} 0Q${f(L*.5)} ${f(c*.18)} ${f(L*.95)} ${f(c*.94)}" fill="none" stroke="${GROOVE}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="${veins}" fill="none" stroke="${VEIN}" stroke-width=".8" stroke-linecap="round"/></g>`;
}

/* A branch from its base to its tip: a curved stem, leaves on alternate sides (largest in the middle, each
   bending back toward the stem), a few sprigs of berries, and a leaf at the tip. */
function branch(r, x0, y0, x1, y1, { bend = 0, leafLen = 60, leaves = 8, spread = .58, berries = .2 } = {}){
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const mx = (x0 + x1) / 2 - dy / len * bend, my = (y0 + y1) / 2 + dx / len * bend;
  const at = t => { const u = 1 - t; return [u*u*x0 + 2*u*t*mx + t*t*x1, u*u*y0 + 2*u*t*my + t*t*y1, Math.atan2(2*u*(my - y0) + 2*t*(y1 - my), 2*u*(mx - x0) + 2*t*(x1 - mx))]; };
  const half = .55, [hx, hy] = at(half);   // the lower half of the stem is a little thicker
  let s = `<path d="M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" fill="none" stroke="${STEM}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M${f(x0)} ${f(y0)}Q${f(x0 + (mx - x0) * half)} ${f(y0 + (my - y0) * half)} ${f(hx)} ${f(hy)}" fill="none" stroke="${STEM}" stroke-width="3.8" stroke-linecap="round"/>`;
  for(let k = 0; k < leaves; k++){
    const t = .07 + k / leaves * .86, [px, py, ta] = at(t), side = k % 2 ? 1 : -1;
    const L = leafLen * (.62 + .46 * Math.sin(Math.PI * (.12 + t * .8))) * (.88 + r() * .24);
    s += leaf(r, px, py, (ta + side * (spread + r() * .22)) * 57.296, L, -side * (.04 + r() * .07));
    if(r() < berries){
      const a = ta - side * (.9 + r() * .3), bx = px + Math.cos(a) * 13, by = py + Math.sin(a) * 13;
      s += `<path d="M${f(px)} ${f(py)}L${f(bx)} ${f(by)}" stroke="${STEM}" stroke-width="1.3"/>`;
      for(let b = 0; b < 2 + (r() < .5); b++){
        const ba = a + (b - .8) * .9, cx = bx + Math.cos(ba) * 4.2, cy = by + Math.sin(ba) * 4.2;
        s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(3.1 + r() * .9)}" fill="url(#dome)" stroke="#5a5a5a" stroke-width=".6"/>`;
      }
    }
  }
  const [tx, ty, ta] = at(1);
  return s + leaf(r, tx, ty, ta * 57.296, leafLen * .66);
}
/* several branches as one piece; (dx, dy) moves them within its picture, which is drawn larger than the stems so no leaf is cut off */
const spray = (seed, dx, dy, ...stems) => { const r = rng(seed); return `<g transform="translate(${dx} ${dy})">${stems.map(([x0, y0, x1, y1, o]) => branch(r, x0, y0, x1, y1, o)).join("")}</g>`; };

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
let GRAIN = "";   // set per picture by render(): the noise has to be as fine as the pixels being drawn
const grainAt = density => `<feTurbulence type="fractalNoise" baseFrequency="${(.55 * density).toFixed(2)}" numOctaves="1" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .01 0 0 0 0" result="grain"/>`;

const LIGHT = {
  // …so that, on a transparent ground, only what rises or falls shows: light above mid-grey, shade below it
  pressed: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1.1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="4.4" diffuseConstant="${KD.toFixed(4)}" lighting-color="#fff" result="lit">${sun}</feDiffuseLighting>
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
  // satin sealing wax: a darker shade of the envelope's cream, cut to its outline; what stands higher is a touch paler,
  // so the lip and the initials read against the pressed plate
  wax: (W, H, id) => `<filter id="${id}" ${box(W, H)}>
    <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
    <feGaussianBlur stdDeviation="1" result="shape"/>
    ${GRAIN}
    <feComposite in="shape" in2="grain" operator="arithmetic" k2="1" k3="1" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="7" diffuseConstant="1.12" lighting-color="#cdb88f" result="matte">${sun}</feDiffuseLighting>
    <feSpecularLighting in="height" surfaceScale="7" specularConstant=".35" specularExponent="18" lighting-color="#fff8e8" result="shine">${sun}</feSpecularLighting>
    <feComposite in="matte" in2="shine" operator="arithmetic" k2="1" k3="1" result="lit"/>
    <feColorMatrix in="shape" type="matrix" values="0 0 0 0 1  0 0 0 0 .955  0 0 0 0 .86  0 0 0 1.5 -.74" result="pale"/>
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

/* layers: [light, art] pairs, bottom first ("plain" = drawn as it is, unlit); art is drawn on a W×H grid and
   the picture comes out `scale` times that. It is lit at twice that size and reduced, which smooths every edge. */
const SUPER = 2;
async function render(file, W, H, layers, { scale = 3, quality = 86, alphaQuality = 88 } = {}){
  GRAIN = grainAt(scale * SUPER);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${DEFS}${layers.map(([light], i) => LIGHT[light]?.(W, H, `l${i}`) ?? "").join("")}</defs>
    ${layers.map(([light, art], i) => `<g ${LIGHT[light] ? `filter="url(#l${i})"` : ""}>${NEEDS_GROUND.has(light) ? `<rect width="${W}" height="${H}" fill="#000"/>` : ""}${art}</g>`).join("")}</svg>`;
  const out = join(root, "public", file);
  const info = await sharp(Buffer.from(svg), { density: 72 * scale * SUPER, limitInputPixels: false })
    .resize(Math.round(W * scale), Math.round(H * scale), { kernel: "lanczos3" })
    .webp({ quality, alphaQuality, effort: 6, smartSubsample: true }).toFile(out);
  console.log(`public/${file}`.padEnd(36), `${info.width}×${info.height}`.padEnd(11), `${Math.round(info.size / 1024)} KB`);
}

/* ---------- the pieces: each is a few branches growing in from an edge of its flap (sizes are CSS px on a phone) ---------- */
mkdirSync(join(root, "public/emboss"), { recursive: true });

// top flap: a great spray from the top-left corner, a smaller one from the top-right
await render("emboss/leaves-top-left.webp", 340, 380, [["pressed", spray(11, 0, 0,
  [-12, 44, 232, 292, { bend: 38, leafLen: 90, leaves: 7 }],
  [-12, 6, 250, 104, { bend: -22, leafLen: 72, leaves: 6, berries: .35 }],
  [-12, 130, 104, 312, { bend: 18, leafLen: 66, leaves: 5 }])]]);
await render("emboss/leaves-top-right.webp", 240, 280, [["pressed", spray(23, 50, 0,
  [202, -12, 52, 176, { bend: -20, leafLen: 68, leaves: 6 }],
  [202, 62, 110, 215, { bend: 12, leafLen: 50, leaves: 4, berries: .5 }])]]);
// side flaps: branches reaching in from the edges
await render("emboss/leaves-left.webp", 190, 320, [["pressed", spray(31, 0, 30,
  [-12, 30, 122, 150, { bend: 16, leafLen: 62, leaves: 5 }],
  [-12, 120, 96, 246, { bend: -12, leafLen: 54, leaves: 5, berries: .35 }])]]);
await render("emboss/leaves-right.webp", 180, 260, [["pressed", spray(43, 50, 30,
  [142, 14, 26, 150, { bend: -14, leafLen: 56, leaves: 5, berries: .35 }])]]);
// bottom flap: one branch along the foot of the envelope, one up its left edge
await render("emboss/leaves-bottom.webp", 350, 260, [["pressed", spray(57, 0, 60,
  [-12, 196, 262, 132, { bend: -20, leafLen: 76, leaves: 7 }],
  [-12, 150, 60, 10, { bend: 10, leafLen: 58, leaves: 5 }])]]);

await render("emboss/badge.webp", 200, 200, [["wax", seal()]], { scale: 4.08, quality: 95, alphaQuality: 100 });   // shown at 136px, drawn 6× so it stays sharp on any phone
await render("emboss/pendant.webp", 76, 124, [["silk", FEATHER], ["plain", GILT], ["pearl", PEARL], ["gold", CORD]], { scale: 5, quality: 95, alphaQuality: 100 });

// behind the cards: one branch per cell, turned every which way
{
  const r = rng(7), W = 600, H = 1000;
  let all = "";
  for(let i = 0; i < 15; i++){
    const cx = ((i % 3) + .5) * W / 3 + (r() - .5) * 60, cy = (Math.floor(i / 3) + .5) * H / 5 + (r() - .5) * 60;
    const a = r() * 6.283, l = 95 + r() * 40;
    all += branch(r, cx - Math.cos(a) * l, cy - Math.sin(a) * l, cx + Math.cos(a) * l, cy + Math.sin(a) * l, { bend: (r() - .5) * 60, leafLen: 56, leaves: 6, berries: .25 });
  }
  await render("paper.webp", W, H, [["paper", all]], { scale: 2.4, quality: 84 });
}
