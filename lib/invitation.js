import { CONFIG } from "./config";

/* Brings the invitation to life: fills in dates, runs the entrance, scroll reveals,
   countdown, gold dust and music.
   Called from components/Invitation.jsx after the page is shown; sets everything up once. */
export function initInvitation(root, guest){
  // while the envelope is closed the page behind it must not scroll (re-applied on every call: React may run
  // the effect, undo it and run it again, and the undo takes the lock off)
  if(document.querySelector("#gate:not(.open)")) document.body.classList.add("locked");
  if(root.dataset.ready) return;
  root.dataset.ready = "1";

  const $ = s => document.querySelector(s);
  const put = (sel, text) => document.querySelectorAll(sel).forEach(el => el.textContent = text);
  function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- embossed leaves on the flaps (made by scripts/emboss.mjs): faded in once they have arrived ---------- */
  Promise.all(["leaves-top-left", "leaves-top-right", "leaves-left", "leaves-right", "leaves-bottom"].map(n => {
    const img = new Image(); img.src = `/emboss/${n}.webp`;
    return img.decode().catch(() => {});
  })).then(() => document.documentElement.classList.add("paper"));

  /* ---------- guest name from the link ----------
     Works as  yoursite.com/#Rahul-Sharma   (also ?to=Rahul+Sharma on your own hosting) */
  const RESERVED = /^(settings|sidebar|customize|upgrade|downloads|comment-.*)$/i;
  function guestFromUrl(){
    let raw = "";
    try{
      const q = new URLSearchParams(location.search);
      raw = q.get("to") || q.get("guest") || q.get("name") || decodeURIComponent(location.hash.slice(1));
    }catch(e){ raw = location.hash.slice(1); }
    if(!raw || RESERVED.test(raw)) return "";
    raw = raw.replace(/[-_+]+/g," ").replace(/[^\p{L}\p{M}\p{N} .&']/gu,"").replace(/\s+/g," ").trim().slice(0,48);
    if(raw && raw === raw.toLowerCase()) raw = raw.replace(/(^|\s)\p{L}/gu, c => c.toUpperCase());
    return raw.replace(/\s(and|And)\s/g," & ");
  }
  function setGuest(name){
    const g = name || CONFIG.defaultGuest;
    document.querySelectorAll("[data-guest]").forEach(el => el.textContent = g);
  }

  /* ---------- fill from CONFIG ---------- */
  put("[data-groom]", CONFIG.groom); put("[data-bride]", CONFIG.bride);

  const wedding = new Date(CONFIG.weddingAt);
  const IST = { timeZone: "Asia/Kolkata" };
  const P = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"numeric", year:"numeric", ...IST }).formatToParts(wedding).map(p => [p.type, +p.value]));
  const monthName = wedding.toLocaleDateString("en-GB", { month:"long", ...IST });
  const dd = String(P.day).padStart(2,"0"), mm = String(P.month).padStart(2,"0");
  put("[data-dot]", `${dd}.${mm}.${P.year}`); put("[data-dm]", `${dd}.${mm}`); put("[data-yr]", P.year);
  put("[data-month]", `${monthName} ${P.year}`);

  /* the celebrations: a winding line with one stop per event, built from CONFIG.events */
  (function(){
    const tl = $("#timeline"), ev = CONFIG.events, ROW = 150, Ht = ev.length * ROW + 46;
    tl.style.height = Ht + "px"; tl.style.setProperty("--len", Math.round(Ht * 1.5)); tl.style.setProperty("--dur", (1.6 + ev.length * .7) + "s");
    let d = "M150 0", html = "";
    ev.forEach((e, i) => {
      const left = i % 2 === 0, x = left ? 105 : 195, y = i * ROW + 70;
      d += i === 0 ? `C150 30 ${x} ${y - 40} ${x} ${y}` : `S${x} ${y - 45} ${x} ${y}`;
      html += `<i class="dot" style="left:${x / 3}%;top:${y}px;animation-delay:${i * .9}s;transition-delay:${i * .6 + .3}s"></i>
        <div class="item ${left ? "r" : "l"}" style="top:${y - 52}px;transition-delay:${i * .6 + .5}s"><span class="w"></span><span class="t"></span><span class="x"></span>${e.note ? '<span class="n"></span>' : ""}</div>`;
    });
    d += `S150 ${Ht - 50} 150 ${Ht - 14}`;
    tl.innerHTML = `<svg class="route" viewBox="0 0 300 ${Ht}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>${html}<svg class="end" viewBox="0 0 40 40" aria-hidden="true"><use class="beat" href="#heart"/></svg>`;
    tl.querySelectorAll(".item").forEach((el, i) => {
      el.querySelector(".w").textContent = ev[i].name; el.querySelector(".t").textContent = ev[i].time; el.querySelector(".x").textContent = ev[i].date;
      if(ev[i].note) el.querySelector(".n").textContent = ev[i].note;
    });
    const lg = $("#legend");
    ev.forEach((e, i) => {
      const sp = document.createElement("span");
      sp.innerHTML = `<svg style="${i === 0 ? "fill:var(--gold)" : "fill:none;stroke:var(--gold);stroke-width:3"}"><use href="#heart"/></svg> <span></span>`;
      sp.lastElementChild.textContent = `${e.day} · ${e.name}`; lg.appendChild(sp);
    });
  })();

  /* names appear letter by letter */
  document.querySelectorAll("[data-split]").forEach(el => {
    const text = el.textContent; el.textContent = ""; el.setAttribute("aria-label", text);
    [...text].forEach((ch, k) => { const s = document.createElement("span"); s.textContent = ch === " " ? "\u00A0" : ch; s.style.setProperty("--k", k); s.setAttribute("aria-hidden","true"); el.appendChild(s); });
  });

  /* monogram crest: interlaced initials in a laurel wreath, ringed by beads, fine ticks and turning text */
  function monogram(id, withText){
    const ringText = `${CONFIG.groom} · ${CONFIG.bride} · The Wedding · ${dd} · ${mm} · ${P.year} · `.toUpperCase();
    let wreath = "", k = 0;
    for(const side of [-1, 1]){
      wreath += `<path class="stem" d="M100 158A58 58 0 0 ${side < 0 ? 1 : 0} ${(100 + side * 58 * Math.sin(2.72)).toFixed(1)} ${(100 + 58 * Math.cos(2.72)).toFixed(1)}"/>`;
      for(let j = 0; j < 10; j++){
        const a = (14 + j * 14.4) * Math.PI / 180, out = j % 2 ? 61.5 : 54.5;
        const x = 100 + side * out * Math.sin(a), y = 100 + out * Math.cos(a);
        const rot = -side * (a * 57.296) + side * (j % 2 ? 62 : 118);
        wreath += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><path class="leaf" style="--k:${k++ % 10}" d="M0 -5.6Q2.9 0 0 5.6Q-2.9 0 0 -5.6Z" fill="url(#mg${id})"/></g>`;
      }
    }
    return `<svg class="mono reveal" viewBox="0 0 200 200" role="img" aria-label="${CONFIG.initials.join(" and ")} monogram">
      <defs>
        <path id="mp${id}" d="M17 100a83 83 0 1 1 166 0a83 83 0 1 1-166 0"/>
        <linearGradient id="mg${id}" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="200" y2="160">
          <stop offset="0" stop-color="#9c7c42"/><stop offset=".45" stop-color="#c5a567"/><stop offset=".5" stop-color="#efdfb0"/><stop offset=".55" stop-color="#c5a567"/><stop offset="1" stop-color="#9c7c42"/>
          <animateTransform attributeName="gradientTransform" type="translate" values="-160 0;160 0;-160 0" dur="7s" repeatCount="indefinite"/>
        </linearGradient>
      </defs>
      <circle class="ring r1" cx="100" cy="100" r="97"/>
      <circle class="beads" cx="100" cy="100" r="92.500"/>
      ${withText ? `<g class="spin"><text class="mtxt"><textPath href="#mp${id}" textLength="516">${ringText}</textPath></text></g>` : ""}
      <circle class="ring r2" cx="100" cy="100" r="73"/>
      <circle class="ticks" cx="100" cy="100" r="69.500"/>
      ${wreath}
      <g class="star" fill="url(#mg${id})"><rect x="97" y="39" width="6" height="6"/><rect x="97" y="39" width="6" height="6" transform="rotate(45 100 42)"/></g>
      <circle cx="100" cy="158" r="1.8" fill="url(#mg${id})"/>
      <text class="mR" x="88" y="118" text-anchor="middle">${CONFIG.initials[0]}</text>
      <text class="mF" x="117" y="130" text-anchor="middle" fill="url(#mg${id})">${CONFIG.initials[1]}</text>
      <text class="mdate" x="101" y="147" text-anchor="middle">${dd} · ${mm} · ${String(P.year).slice(2)}</text>
    </svg>`;
  }
  document.querySelectorAll("[data-mono]").forEach((el, i) => el.innerHTML = monogram(i, el.dataset.mono === "big"));

  /* month calendar, Monday first, hearts on the two days */
  (function(){
    const cal = $("#cal"); let k = 0;
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d => { const e = document.createElement("div"); e.className = "dow"; e.textContent = d; cal.appendChild(e); });
    const first = (new Date(Date.UTC(P.year, P.month - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(P.year, P.month, 0)).getUTCDate();
    for(let i = 0; i < first; i++) cal.appendChild(document.createElement("div"));
    for(let d = 1; d <= days; d++){
      const e = document.createElement("div"); e.className = "d"; e.style.setProperty("--k", k++);
      const kind = d === CONFIG.events[0].day ? "nikah" : CONFIG.events.some(e => e.day === d) ? "dawat" : "";
      if(kind){ e.classList.add(kind); e.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true"><path class="beat" d="M20 33C8 24 5 18 5 13.5C5 9 8.5 6 12.5 6C15.5 6 18.3 7.8 20 11C21.7 7.8 24.5 6 27.5 6C31.5 6 35 9 35 13.5C35 18 32 24 20 33Z"/></svg>`; }
      const s = document.createElement("span"); s.textContent = d; e.appendChild(s);
      cal.appendChild(e);
    }
  })();

  /* pearls resting on every card, down both sides */
  const pearls = [];
  (function(){
    const r = rng(7);
    document.querySelectorAll(".card").forEach(card => {
      const rows = Math.max(3, Math.round(card.offsetHeight / 150));
      for(let i = 0; i < rows; i++) for(const side of ["left","right"]){
        if(r() < .12) continue;
        const p = document.createElement("i"); p.className = "pearl"; p.setAttribute("aria-hidden","true");
        const size = 11 + r() * 6;
        p.style.cssText = `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;top:${((i + .25 + r() * .5) / rows * 100).toFixed(2)}%;${side}:${(6 + r() * 12).toFixed(1)}px;animation-delay:${(-r() * 6).toFixed(1)}s;transition-delay:${(r() * .9).toFixed(2)}s`;
        card.appendChild(p); pearls.push(p);
      }
    });
  })();

  const initialGuest = guest || guestFromUrl();
  setGuest(initialGuest);

  /* ---------- music: soft piano over strings in a hall, made in the browser; starts when the seal is opened ----------
     To use your own song instead, add an audio file to the page and set MUSIC_FILE to its name. */
  const MUSIC_FILE = CONFIG.musicFile || "";
  let ac, master, verb, tune, musicOn = false, step = 0, nextAt = 0, loop;
  const EIGHTH = .47;                                   // tempo: about 64 beats a minute
  /* eight bars: [string-pad notes], [eight piano notes, low to high and back] */
  const BARS = [
    [[185, 220, 277.18, 329.63],    [146.83, 220, 329.63, 369.99, 440, 369.99, 329.63, 220]],       // D maj9
    [[146.83, 185, 220, 293.66],    [123.47, 185, 293.66, 369.99, 440, 369.99, 293.66, 185]],       // B m7
    [[196, 246.94, 293.66, 369.99], [98, 146.83, 246.94, 293.66, 369.99, 293.66, 246.94, 146.83]],  // G maj7
    [[220, 293.66, 329.63],         [110, 164.81, 220, 293.66, 329.63, 277.18, 220, 164.81]],       // A sus4 - A
    [[220, 277.18, 329.63],         [92.5, 138.59, 220, 277.18, 329.63, 277.18, 220, 138.59]],      // F# m7
    [[146.83, 185, 220, 293.66],    [123.47, 185, 293.66, 369.99, 440, 369.99, 293.66, 185]],       // B m7
    [[196, 246.94, 293.66, 369.99], [82.41, 123.47, 196, 246.94, 293.66, 369.99, 293.66, 246.94]],  // E m9
    [[196, 220, 277.18, 329.63],    [110, 164.81, 196, 277.18, 329.63, 392, 329.63, 277.18]]        // A 7
  ];
  /* the tune: step in the 64-step cycle -> [note, length in steps] */
  const MELODY = { 0:[739.99,3], 3:[659.25,1], 4:[880,4], 8:[587.33,4], 12:[739.99,4], 16:[493.88,2], 18:[587.33,2], 20:[739.99,2], 22:[659.25,2],
    24:[659.25,6], 30:[554.37,2], 32:[880,3], 35:[739.99,1], 36:[659.25,4], 40:[587.33,2], 42:[739.99,2], 44:[987.77,4],
    48:[783.99,3], 51:[739.99,1], 52:[659.25,2], 54:[587.33,2], 56:[554.37,4], 60:[659.25,4] };
  function buildSound(){
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ac.destination);
    /* a concert-hall echo, made from fading noise */
    const len = Math.floor(ac.sampleRate * 3.4), ir = ac.createBuffer(2, len, ac.sampleRate);
    for(let c = 0; c < 2; c++){ const d = ir.getChannelData(c); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    verb = ac.createConvolver(); verb.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = .5; verb.connect(wet); wet.connect(master);
  }
  function piano(f, t, vel, len){
    const out = ac.createGain(), lp = ac.createBiquadFilter(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    lp.type = "lowpass"; lp.frequency.value = 1500 + vel * 9000; lp.Q.value = .3;
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(vel, t + .008);
    out.gain.exponentialRampToValueAtTime(vel * .3, t + .4); out.gain.exponentialRampToValueAtTime(.0006, t + len);
    [1, .42, .2, .09, .04].forEach((amp, i) => {
      const n = i + 1, o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = f * n * (1 + .0005 * n * n); g.gain.value = amp;
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + len + .1);
    });
    lp.connect(out);
    if(pan){ pan.pan.value = Math.max(-.5, Math.min(.5, Math.log2(f / 330) * .28)); out.connect(pan); pan.connect(master); pan.connect(verb); }
    else { out.connect(master); out.connect(verb); }
  }
  function strings(notes, t, dur){
    const g = ac.createGain(), lp = ac.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 850; lp.Q.value = .5;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + dur * .45); g.gain.linearRampToValueAtTime(.04, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 1.8);
    notes.forEach(f => [-7, 7].forEach(cents => {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cents;
      o.connect(lp); o.start(t); o.stop(t + dur + 2);
    }));
    lp.connect(g); g.connect(master); g.connect(verb);
  }
  function schedule(){
    if(!root.isConnected){ clearInterval(loop); if(ac) ac.close(); return; }
    while(nextAt < ac.currentTime + .5){
      const cycle = Math.floor(step / 64), s64 = step % 64, bar = Math.floor(s64 / 8), i = s64 % 8, [pad, arp] = BARS[bar];
      const t = nextAt + (Math.random() - .5) * .018;
      if(i === 0) strings(pad, nextAt, EIGHTH * 8);
      piano(arp[i], t, (i === 0 ? .17 : i === 4 ? .1 : .075) * (.9 + Math.random() * .2), i === 0 ? 4.5 : 2.6);
      const m = MELODY[s64];
      if(m && cycle > 0) piano(m[0], t + .012, .15 * (.88 + Math.random() * .24), Math.max(2.4, m[1] * EIGHTH + 1.6));   // first time round is an introduction
      nextAt += EIGHTH; step++;
    }
  }
  function setMusic(on){
    const btn = $("#music");
    try{
      if(MUSIC_FILE){
        if(!tune){ tune = new Audio(MUSIC_FILE); tune.loop = true; tune.volume = .6; }
        on ? tune.play().catch(() => {}) : tune.pause();
      }else{
        if(!ac) buildSound();
        if(on){
          ac.resume(); nextAt = ac.currentTime + .1;
          master.gain.cancelScheduledValues(ac.currentTime); master.gain.linearRampToValueAtTime(.95, ac.currentTime + 3);
          clearInterval(loop); loop = setInterval(schedule, 120); schedule();
        }else{
          clearInterval(loop);
          master.gain.cancelScheduledValues(ac.currentTime); master.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2);
        }
      }
      musicOn = on;
    }catch(e){ musicOn = false; }
    btn.setAttribute("aria-pressed", String(musicOn)); btn.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
  }
  $("#music").addEventListener("click", () => setMusic(!musicOn));
  let wasOn = false;
  document.addEventListener("visibilitychange", () => { if(document.hidden){ wasOn = musicOn; if(musicOn) setMusic(false); } else if(wasOn) setMusic(true); });

  /* ---------- entrance ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gate = $("#gate");
  $("#tapBtn").addEventListener("click", () => $("#openBtn").click());   // the hint is a button too
  $("#openBtn").addEventListener("click", () => {
    document.querySelector(".ripple.idle").classList.remove("idle");
    gate.classList.add("open");
    $("#music").hidden = false; setMusic(true);
    document.body.classList.remove("locked");
    document.body.classList.add("opened");
    burst();
    setTimeout(() => {
      $(".hero .mono").classList.remove("pre");
      $(".hero").querySelectorAll(".pearl").forEach(p => p.classList.remove("pre"));
    }, reduce ? 0 : 2300);
    setTimeout(() => gate.remove(), reduce ? 0 : 2900);
  });

  /* ---------- reveal on scroll: every piece arrives on its own beat ---------- */
  const reveals = [...document.querySelectorAll(".reveal")];
  if("IntersectionObserver" in window && !reduce){
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.remove("pre"); io.unobserve(e.target); }
    }), { threshold:.2 });
    const cardIo = new IntersectionObserver(entries => entries.forEach(e => {
      if(e.isIntersecting){ e.target.classList.remove("pre"); e.target.querySelectorAll(".pearl").forEach(p => p.classList.remove("pre")); cardIo.unobserve(e.target); }
    }), { threshold:.06 });
    pearls.forEach(p => p.classList.add("pre"));
    reveals.forEach(el => {
      el.classList.add("pre");
      if(el.closest(".hero")) return;                   // the first card is released by the entrance
      if(el.classList.contains("card")){ cardIo.observe(el); return; }
      const sibs = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
      if(!el.matches(".cal,.timeline,.wave,.mono")) el.style.transitionDelay = Math.min(sibs.indexOf(el) % 6, 5) * .1 + "s";
      io.observe(el);
    });
  }
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $("#progress").style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  }, { passive:true });

  /* ---------- countdown ---------- */
  const cdEls = { d:$("#cd"), h:$("#ch"), m:$("#cm"), s:$("#cs") };
  function setNum(el, v){
    const t = String(v).padStart(2,"0");
    if(el.textContent !== t){ el.textContent = t; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
  }
  function tickCountdown(){
    if(!root.isConnected) return;
    let diff = Math.floor((wedding - Date.now()) / 1000);
    if(diff <= 0){ $("#countTitle").textContent = "The celebrations have begun"; $("#count").hidden = true; $("#countSub").hidden = true; return; }
    setNum(cdEls.d, Math.floor(diff / 86400)); diff %= 86400;
    setNum(cdEls.h, Math.floor(diff / 3600));  diff %= 3600;
    setNum(cdEls.m, Math.floor(diff / 60));
    setNum(cdEls.s, diff % 60);
    setTimeout(tickCountdown, 1000);
  }
  tickCountdown();

  /* ---------- a few motes of gold in the air; a soft shower when the seal is opened ---------- */
  const cv = $("#dust"), cx = cv.getContext("2d");
  let W = 0, H = 0, motes = [], flakes = [];
  const newMote = () => ({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.4+.6, vy:-(Math.random()*.18+.05), vx:(Math.random()-.5)*.12, p:Math.random()*6.28, s:Math.random()*1.2+.5 });
  function resize(){
    const r = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; cx.setTransform(r,0,0,r,0,0);
    motes = Array.from({length:Math.max(14, Math.round(W * H / 38000))}, newMote);
  }
  function burst(){
    if(reduce) return;
    for(let i = 0; i < 46; i++) flakes.push({ x:Math.random()*W, y:-20 - Math.random()*H*.7, w:Math.random()*5+3, vy:Math.random()*1.3+.9, vx:(Math.random()-.5)*.7, a:Math.random()*6.28, va:(Math.random()-.5)*.12, p:Math.random()*6.28, c:Math.random() < .5 ? "#c9ad70" : "#efe3c2" });
  }
  function frame(t){
    if(!root.isConnected) return;
    cx.clearRect(0,0,W,H);
    const k = t / 1000;
    for(const m of motes){
      m.x += m.vx + Math.sin(k * .6 + m.p) * .08; m.y += m.vy;
      if(m.y < -8){ Object.assign(m, newMote(), { y:H + 8 }); }
      cx.globalAlpha = .2 + .35 * (0.5 + 0.5 * Math.sin(k * m.s + m.p));
      cx.fillStyle = "#fff8e1"; cx.beginPath(); cx.arc(m.x, m.y, m.r + .4, 0, 6.28); cx.fill();
      cx.fillStyle = "#b3925a"; cx.beginPath(); cx.arc(m.x, m.y, m.r * .7, 0, 6.28); cx.fill();
    }
    for(let i = flakes.length - 1; i >= 0; i--){
      const f = flakes[i];
      f.x += f.vx + Math.sin(k * 1.5 + f.p) * .5; f.y += f.vy; f.a += f.va;
      if(f.y > H + 20){ flakes.splice(i,1); continue; }
      cx.save(); cx.translate(f.x,f.y); cx.rotate(f.a); cx.scale(1, Math.abs(Math.cos(k * 2 + f.p)) * .8 + .2);
      cx.globalAlpha = .85; cx.fillStyle = f.c; cx.fillRect(-f.w/2, -f.w/2, f.w, f.w); cx.restore();
    }
    cx.globalAlpha = 1;
    if(!reduce) requestAnimationFrame(frame);
  }
  addEventListener("resize", resize); resize(); requestAnimationFrame(frame);
}
