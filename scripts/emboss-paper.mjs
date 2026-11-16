/* Makes public/paper.webp: the embossed floral paper used for the envelope and behind the cards.
   Run it again only if you change the pattern below:   npm run paper

   Drawn as a height map (brighter = higher): domed petals laid over one another with a groove round each,
   ridged leaves with pressed veins, rounded stems. The map is then lit from the top left like real card,
   with a faint satin sheen and paper tooth. Lighting is slow to compute, so it is done here once rather
   than on every guest's phone. */
import sharp from "sharp";
import { fileURLToPath } from "node:url";

function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const r = rng(7), W = 600, H = 1000, f = n => n.toFixed(1);
const GROOVE = "#555", VEIN = "#767676";
let h = "";
const petal = R => `M0 0C${f(R*.5)} ${f(-R*.14)} ${f(R*.54)} ${f(-R*.96)} 0 ${f(-R)}C${f(-R*.54)} ${f(-R*.96)} ${f(-R*.5)} ${f(-R*.14)} 0 0Z`;
function leaf(x, y, deg, L){
  const w = L * (.24 + r() * .08);
  let v = "";
  for(let k = 1; k <= 4; k++){ const x0 = L * k / 5.4, y0 = w * .66 * (1 - k / 7); v += `M${f(x0)} 0L${f(x0 + L*.13)} ${f(-y0)}M${f(x0)} 0L${f(x0 + L*.13)} ${f(y0)}`; }
  h += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})">
    <path d="M0 0Q${f(L*.45)} ${f(-w)} ${f(L)} 0Q${f(L*.45)} ${f(w)} 0 0Z" fill="url(#ridge)" stroke="#6a6a6a" stroke-width=".8"/>
    <path d="M${f(L*.04)} 0Q${f(L*.5)} ${f(-w*.1)} ${f(L*.93)} 0" fill="none" stroke="${GROOVE}" stroke-width="1.4"/>
    <path d="${v}" fill="none" stroke="${VEIN}" stroke-width=".9" stroke-linecap="round"/></g>`;
}
function flower(x, y, R){
  const n = r() < .5 ? 5 : 6, rot = r() * 360;
  let p = "", dots = "";
  for(let k = 0; k < n; k++){   // each petal hides the groove of the one beneath, so they read as layered
    p += `<g transform="rotate(${f(rot + k * 360 / n)})"><path d="${petal(R)}" fill="url(#dome)" stroke="${GROOVE}" stroke-width="1.2"/>
      <path d="M0 ${f(-R*.3)}L0 ${f(-R*.8)}M${f(-R*.1)} ${f(-R*.32)}Q${f(-R*.21)} ${f(-R*.58)} ${f(-R*.14)} ${f(-R*.77)}M${f(R*.1)} ${f(-R*.32)}Q${f(R*.21)} ${f(-R*.58)} ${f(R*.14)} ${f(-R*.77)}" fill="none" stroke="${VEIN}" stroke-width=".9" stroke-linecap="round"/></g>`;
  }
  for(let k = 0; k < 11; k++){ const a = k * .571 + r() * .2, d = R * (.26 + r() * .07); dots += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(1.1 + R * .028)}"/>`; }
  h += `<g transform="translate(${f(x)} ${f(y)})">${p}<g fill="#f2f2f2">${dots}</g><circle r="${f(R*.18)}" fill="url(#heart)" stroke="${GROOVE}" stroke-width="1.1"/></g>`;
}
/* one sprig per cell: a curving stem with leaves along it, a blossom at its head and a bud at its tail */
for(let i = 0; i < 15; i++){
  const cx = ((i % 3) + .2 + r() * .6) * W / 3, cy = (Math.floor(i / 3) + .2 + r() * .6) * H / 5;
  const ang = r() * 6.283, len = 130 + r() * 90, bend = (r() - .5) * 120;
  const x2 = cx + Math.cos(ang) * len, y2 = cy + Math.sin(ang) * len;
  const mx = (cx + x2) / 2 - Math.sin(ang) * bend, my = (cy + y2) / 2 + Math.cos(ang) * bend;
  h += `<path d="M${f(cx)} ${f(cy)}Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}" fill="none" stroke="#8c8c8c" stroke-width="4" stroke-linecap="round"/>`;
  for(let k = 1; k <= 4; k++){
    const t = .22 + k * .17, u = 1 - t;
    const px = u*u*cx + 2*u*t*mx + t*t*x2, py = u*u*cy + 2*u*t*my + t*t*y2;
    const ta = Math.atan2(2*u*(my - cy) + 2*t*(y2 - my), 2*u*(mx - cx) + 2*t*(x2 - mx));
    leaf(px, py, (ta + (k % 2 ? 1 : -1) * (.6 + r() * .4)) * 57.296, 36 + r() * 28);
  }
  h += `<g transform="translate(${f(x2)} ${f(y2)}) rotate(${f(ang * 57.296 + 90)})"><ellipse rx="7" ry="11" fill="url(#dome)" stroke="${GROOVE}" stroke-width=".9"/><path d="M0 -8V8" stroke="${VEIN}" stroke-width=".9"/></g>`;
  flower(cx, cy, 36 + r() * 30);
}
const sun = `<feDistantLight azimuth="225" elevation="50"/>`;   // light from the top left
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="dome" cx=".5" cy=".45" r=".62"><stop offset="0" stop-color="#d8d8d8"/><stop offset=".72" stop-color="#ababab"/><stop offset="1" stop-color="#8a8a8a"/></radialGradient>
    <radialGradient id="heart" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#9a9a9a"/></radialGradient>
    <linearGradient id="ridge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7a7a"/><stop offset=".5" stop-color="#c4c4c4"/><stop offset="1" stop-color="#7a7a7a"/></linearGradient>
    <filter id="light" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>
      <feGaussianBlur stdDeviation="1.2" result="shape"/>
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .016 0 0 0 0" result="tooth"/>
      <feComposite in="shape" in2="tooth" operator="arithmetic" k2="1" k3="1" result="height"/>
      <feDiffuseLighting in="height" surfaceScale="3.5" diffuseConstant="1.27" lighting-color="#f2eadd" result="matte">${sun}</feDiffuseLighting>
      <feSpecularLighting in="height" surfaceScale="3.5" specularConstant=".5" specularExponent="26" lighting-color="#fffbf2" result="sheen">${sun}</feSpecularLighting>
      <feComposite in="matte" in2="sheen" operator="arithmetic" k2="1" k3=".3"/>
    </filter>
  </defs>
  <g filter="url(#light)"><rect width="${W}" height="${H}" fill="#000"/>${h}</g>
</svg>`;

const out = fileURLToPath(new URL("../public/paper.webp", import.meta.url));
const info = await sharp(Buffer.from(svg), { density: 72 * 2 }).webp({ quality: 82 }).toFile(out);
console.log(`public/paper.webp  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
