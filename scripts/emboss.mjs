/* Makes the blind-embossed artwork for the envelope, lit once here because lighting is too slow for phones:

     public/emboss/monogram.webp                  the initials pressed into the top flap
     public/emboss/branch-left|right.webp         leafy branches on the side flaps
     public/emboss/sprig-left|right.webp          small sprigs in the bottom corners
     public/paper.webp                            all-over leafy paper behind the cards

   Run it again after changing anything here or the initials in lib/config.js:   npm run emboss

   Each piece is drawn as a height map (brighter = higher: domed leaves with a pressed midrib and veins,
   rounded stems, berries, letters) and lit from the top left. The envelope pieces keep only the light and
   shade, on a transparent ground, so they sit on the paper colour set in globals.css. */
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

/* ---------- height-map pieces ---------- */
function leaf(r, x, y, deg, L){
  const w = L * (.2 + r() * .05);
  let v = "";
  for(let k = 1; k <= 3; k++){ const x0 = L * k / 4.4, y0 = w * .62 * (1 - k / 6); v += `M${f(x0)} 0L${f(x0 + L*.12)} ${f(-y0)}M${f(x0)} 0L${f(x0 + L*.12)} ${f(y0)}`; }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">
    <path d="M0 0C${f(L*.28)} ${f(-w)} ${f(L*.7)} ${f(-w*.85)} ${f(L)} 0C${f(L*.7)} ${f(w*.85)} ${f(L*.28)} ${f(w)} 0 0Z" fill="url(#ridge)" stroke="#6a6a6a" stroke-width=".7"/>
    <path d="M${f(L*.03)} 0Q${f(L*.5)} ${f(-w*.08)} ${f(L*.93)} 0" fill="none" stroke="${GROOVE}" stroke-width="1.1"/>
    <path d="${v}" fill="none" stroke="${VEIN}" stroke-width=".7" stroke-linecap="round"/></g>`;
}

/* A slender branch from its base to its tip: leaves in alternating pairs that shrink toward the tip, a few berries. */
function branch(r, x0, y0, x1, y1, { bend = 0, leafLen = 34, leaves = 14, berries = .3 } = {}){
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const mx = (x0 + x1) / 2 - dy / len * bend, my = (y0 + y1) / 2 + dx / len * bend;
  const at = t => { const u = 1 - t; return [u*u*x0 + 2*u*t*mx + t*t*x1, u*u*y0 + 2*u*t*my + t*t*y1, Math.atan2(2*u*(my - y0) + 2*t*(y1 - my), 2*u*(mx - x0) + 2*t*(x1 - mx))]; };
  const half = .55, [hx, hy] = at(half);   // the lower half of the stem is a little thicker
  let s = `<path d="M${f(x0)} ${f(y0)}Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" fill="none" stroke="${STEM}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${f(x0)} ${f(y0)}Q${f(x0 + (mx - x0) * half)} ${f(y0 + (my - y0) * half)} ${f(hx)} ${f(hy)}" fill="none" stroke="${STEM}" stroke-width="3.4" stroke-linecap="round"/>`;
  for(let k = 0; k < leaves; k++){
    const t = .1 + k / leaves * .84, [px, py, ta] = at(t), side = k % 2 ? 1 : -1;
    s += leaf(r, px, py, (ta + side * (.7 + r() * .25)) * 57.296, leafLen * (1 - .42 * t) * (.88 + r() * .24));
    if(r() < berries){
      const a = ta - side * (.95 + r() * .3), bx = px + Math.cos(a) * 10, by = py + Math.sin(a) * 10;
      s += `<path d="M${f(px)} ${f(py)}L${f(bx)} ${f(by)}" stroke="${STEM}" stroke-width="1.2"/>`;
      for(let b = 0; b < 2 + (r() < .5); b++){
        const ba = a + (b - .8) * .9, cx = bx + Math.cos(ba) * 3.6, cy = by + Math.sin(ba) * 3.6;
        s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(2.8 + r() * .8)}" fill="url(#dome)" stroke="#5a5a5a" stroke-width=".6"/>`;
      }
    }
  }
  const [tx, ty, ta] = at(1);
  return s + leaf(r, tx, ty, ta * 57.296, leafLen * .55);
}

function monogram(W, H){
  const [a, b] = CONFIG.initials, font = `font-family="Bodoni Moda 96pt" text-anchor="middle"`;
  return `<text x="${W*.37}" y="${H*.66}" ${font} font-size="${H*.66}" fill="#cfcfcf">${a}</text>
    <text x="${W*.535}" y="${H*.56}" ${font} font-style="italic" font-size="${H*.26}" fill="#bdbdbd">&amp;</text>
    <text x="${W*.66}" y="${H*.9}" ${font} font-style="italic" font-size="${H*.66}" fill="#d4d4d4" stroke="#2e2e2e" stroke-width="${H*.028}" stroke-linejoin="round" paint-order="stroke">${b}</text>`;
}

/* ---------- lighting ---------- */
const sun = `<feDistantLight azimuth="225" elevation="50"/>`;   // from the top left
const DEFS = `
  <radialGradient id="dome" cx=".42" cy=".4" r=".62"><stop offset="0" stop-color="#d8d8d8"/><stop offset=".72" stop-color="#ababab"/><stop offset="1" stop-color="#8a8a8a"/></radialGradient>
  <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#c4c4c4"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient>`;
const box = (W, H) => `filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB"`;
const KD = .5 / Math.sin(50 * Math.PI / 180);   // flat paper lights to exactly mid-grey…

// …so that, on a transparent ground, only what rises or falls shows: light above mid-grey, shade below it
const pressedLight = (W, H) => `<filter id="light" ${box(W, H)}>
  <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
  <feGaussianBlur stdDeviation="1.1" result="height"/>
  <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="${KD.toFixed(4)}" lighting-color="#fff" result="lit">${sun}</feDiffuseLighting>
  <feColorMatrix in="lit" type="matrix" values="0 0 0 0 1  0 0 0 0 .99  0 0 0 0 .96  4 0 0 0 -2.04" result="hi"/>
  <feColorMatrix in="lit" type="matrix" values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .15  -1.7 0 0 0 .83" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
</filter>`;

// the opaque paper behind the cards: lit cream stock with a satin sheen and fine tooth
const paperLight = (W, H) => `<filter id="light" ${box(W, H)}>
  <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
  <feGaussianBlur stdDeviation="1.2" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>
  <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .016 0 0 0 0" result="tooth"/>
  <feComposite in="shape" in2="tooth" operator="arithmetic" k2="1" k3="1" result="height"/>
  <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="1.27" lighting-color="#f2eadd" result="matte">${sun}</feDiffuseLighting>
  <feSpecularLighting in="height" surfaceScale="3.5" specularConstant=".5" specularExponent="26" lighting-color="#fffbf2" result="sheen">${sun}</feSpecularLighting>
  <feComposite in="matte" in2="sheen" operator="arithmetic" k2="1" k3=".3"/>
</filter>`;

async function render(file, W, H, art, { mirror = false, paper = false } = {}){
  const shapes = mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${art}</g>` : art;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${DEFS}${paper ? paperLight(W, H) : pressedLight(W, H)}</defs>
    <g filter="url(#light)"><rect width="${W}" height="${H}" fill="#000"/>${shapes}</g></svg>`;
  const out = join(root, "public", file);
  const info = await sharp(Buffer.from(svg), { density: 72 * 2 }).webp({ quality: 85, alphaQuality: 90 }).toFile(out);
  console.log(`public/${file}`.padEnd(32), `${info.width}×${info.height}`.padEnd(10), `${Math.round(info.size / 1024)} KB`);
}

/* ---------- the pieces (sizes are CSS pixels; drawn at 2×) ---------- */
mkdirSync(join(root, "public/emboss"), { recursive: true });

await render("emboss/monogram.webp", 240, 220, monogram(240, 220));

const sideBranch = branch(rng(21), 168, 388, 40, 38, { bend: 30, leafLen: 50, leaves: 18 });
await render("emboss/branch-left.webp", 200, 400, sideBranch);
await render("emboss/branch-right.webp", 200, 400, sideBranch, { mirror: true });

const cornerSprig = branch(rng(5), 14, 200, 130, 26, { bend: -16, leafLen: 40, leaves: 12, berries: .35 });
await render("emboss/sprig-left.webp", 150, 210, cornerSprig);
await render("emboss/sprig-right.webp", 150, 210, cornerSprig, { mirror: true });

// behind the cards: one branch per cell, turned every which way
{
  const r = rng(7), W = 600, H = 1000;
  let all = "";
  for(let i = 0; i < 15; i++){
    const cx = ((i % 3) + .5) * W / 3 + (r() - .5) * 60, cy = (Math.floor(i / 3) + .5) * H / 5 + (r() - .5) * 60;
    const a = r() * 6.283, l = 95 + r() * 40;
    all += branch(r, cx - Math.cos(a) * l, cy - Math.sin(a) * l, cx + Math.cos(a) * l, cy + Math.sin(a) * l, { bend: (r() - .5) * 60, leafLen: 44, leaves: 14, berries: .25 });
  }
  await render("paper.webp", W, H, all, { paper: true });
}
