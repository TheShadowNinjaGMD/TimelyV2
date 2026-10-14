/* Timely – timer, stopwatch and Pomodoro. Vanilla JS, no dependencies. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const root = document.documentElement;
  const BASE_TITLE = document.title;
  const KEY = "timely.v2";
  const MAX_MS = 5999 * 1000; // 5999 seconds, like the original app
  const FOCUS_MS = 25 * 60 * 1000;
  const BREAK_MS = 5 * 60 * 1000;
  const PRESETS = [30, 60, 300, 600]; // seconds

  const THEMES = [
    "ocean", "sunset", "forest", "lavender", "midnight", "rose", "candy", "gold", "slate", "cherry",
    "mint", "tangerine", "nebula", "autumn", "arctic", "neon", "coffee", "plum", "coral",
  ];

  const DEFAULTS = {
    scheme: "auto", theme: "ocean", custom: null,
    sound: true, vol: 0.8,
    musicOn: false, music: 0.4, studyMusic: false,
    autoBreak: true, study: false, liquid: false, style: "liquid",
    audioUrl: "", timerLen: 300000,
  };
  let S = { ...DEFAULTS };

  /* ---------- Persistence ---------- */
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
    }, 120);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        S = { ...DEFAULTS, ...JSON.parse(raw) };
      } else {
        // Migrate from the first version of Timely.
        const old = JSON.parse(localStorage.getItem("timely") || "null");
        if (old) {
          S.theme = THEMES.includes(old.theme) || old.theme === "custom" ? old.theme : "ocean";
          S.scheme = old.lightMode ? "light" : "auto";
          S.sound = old.sound !== false;
          S.vol = Number(old.vol) || DEFAULTS.vol;
          S.music = Number(old.music) || DEFAULTS.music;
          S.musicOn = !!old.musicOn;
          S.studyMusic = !!old.studyMusicOn;
          S.audioUrl = old.audioUrl || "";
          if (old.theme === "custom" && old.customTheme && /^#[0-9a-f]{6}$/i.test(old.customTheme.accent)) {
            const { r, g, b } = hexToRgb(old.customTheme.accent);
            const { h, s, v } = rgbToHsv(r, g, b);
            S.custom = customFromHsv(h, s, v);
          } else if (S.theme === "custom") {
            S.theme = "ocean";
          }
        }
      }
    } catch (e) { S = { ...DEFAULTS }; }
    if (S.style !== "standard") S.style = "liquid";
    if (!THEMES.includes(S.theme) && S.theme !== "custom") S.theme = "ocean";
    if (S.theme === "custom" && !S.custom) S.theme = "ocean";
    S.timerLen = clamp(Number(S.timerLen) || DEFAULTS.timerLen, 1000, MAX_MS);
  }

  /* ---------- Helpers ---------- */
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  const pad = (n) => String(n).padStart(2, "0");

  function fmtTimer(ms) {
    const total = Math.ceil(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${Math.floor(total / 60)}:${pad(s)}`;
  }

  function fmtSplit(ms) {
    const cs = Math.floor(ms / 10) % 100;
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${pad(total % 60)}.${pad(cs)}`;
  }

  // "5" = 5 min, "10" = 10 min, "500" = 5:00, "1030" = 10:30, "5:30", "1:05:00"
  function parseTime(str) {
    const t = str.trim();
    if (!t) return null;
    let sec;
    if (t.includes(":")) {
      const parts = t.split(":").map((p) => (p === "" ? 0 : Number(p)));
      if (parts.length > 3 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
      sec = parts.reduce((acc, n) => acc * 60 + n, 0);
    } else if (/^\d+$/.test(t)) {
      if (t.length <= 2) sec = Number(t) * 60;
      else sec = Number(t.slice(0, -2)) * 60 + Number(t.slice(-2));
    } else return null;
    return sec > 0 ? Math.min(Math.round(sec) * 1000, MAX_MS) : null;
  }

  /* ---------- Color math ---------- */
  function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
  }
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return { h: Math.round(h), s: Math.round(max ? (d / max) * 100 : 0), v: Math.round(max * 100) };
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function rgbToCmyk(r, g, b) {
    const R = r / 255, G = g / 255, B = b / 255, k = 1 - Math.max(R, G, B);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const f = (x) => Math.round(((1 - x - k) / (1 - k)) * 100);
    return { c: f(R), m: f(G), y: f(B), k: Math.round(k * 100) };
  }
  const rgbToHex = ({ r, g, b }) => "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  function hexToRgb(hex) {
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
  }
  function onColor({ r, g, b }) {
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.4 ? "#000000" : "#ffffff";
  }
  function customFromHsv(h, s, v) {
    const rgb = hsvToRgb(h, s, v);
    return { h, s, v, accent: rgbToHex(rgb), on: onColor(rgb) };
  }

  /* ---------- Sound (Web Audio, created on first interaction) ---------- */
  let actx = null;
  function audio() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === "suspended") actx.resume().catch(() => {});
    return actx;
  }

  function tone(freq, dur, level, delay = 0) {
    if (!S.sound) return;
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const v = Math.max(0.0001, S.vol * level);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(v, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  const click = () => tone(1100, 0.05, 0.12);
  function chime() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.7, 0.3, i * 0.14)); }

  /* ---------- Music (lazy: nothing downloads until it is switched on) ---------- */
  let bg = null;
  let custom = null;
  const musicVol = () => clamp(S.vol * S.music, 0, 1);

  function playMusic() {
    if (!S.musicOn) return;
    if (!bg) { bg = new Audio(); bg.loop = true; bg.preload = "none"; bg.src = "assets/ambient.mp3"; }
    bg.volume = musicVol();
    bg.play().catch(() => {});
  }
  const pauseMusic = () => { if (bg) bg.pause(); };
  function applyMusicVolume() {
    if (bg) bg.volume = musicVol();
    if (custom) custom.volume = musicVol();
  }
  const studyMusicActive = () => S.study && S.studyMusic && S.musicOn;

  /* ---------- Toast + announcements ---------- */
  let toastTimer = 0;
  function notify(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    $("#announce").textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  /* ---------- Elements ---------- */
  const el = {
    ring: $("#ring"), ringFg: $("#ringFg"),
    timeInput: $("#timeInput"), swTime: $("#swTime"), swCs: $("#swCs"),
    timerView: $("#timerView"), swView: $("#stopwatchView"),
    presets: $("#presets"), lapList: $("#lapList"),
    play: $("#playBtn"), playUse: $("#playUse"), reset: $("#resetBtn"), lap: $("#lapBtn"),
    chip: $("#studyChip"), dock: $("#dock"),
    tabs: [...document.querySelectorAll(".seg-btn")],
  };

  let mode = "timer";

  /* ---------- Timer ---------- */
  const T = { len: 300000, remaining: 300000, endAt: 0, running: false, id: 0, lastSec: -1, phase: "focus", session: 1 };

  function renderTimer(force) {
    const sec = Math.ceil(T.remaining / 1000);
    if (force || sec !== T.lastSec) {
      T.lastSec = sec;
      if (document.activeElement !== el.timeInput || T.running) el.timeInput.value = fmtTimer(T.remaining);
      if (mode === "timer") {
        const frac = T.len ? clamp(T.remaining / T.len, 0, 1) : 0;
        el.ringFg.style.strokeDashoffset = String(1 - frac);
        el.ring.classList.toggle("empty", frac <= 0);
        updateTitle();
      }
    }
  }

  function setTimerEditable() {
    el.timeInput.readOnly = T.running || S.study;
  }

  function startTimer() {
    if (T.running) return;
    if (T.remaining <= 0) T.remaining = T.len;
    T.endAt = Date.now() + T.remaining;
    T.running = true;
    T.id = setInterval(tickTimer, 200);
    setTimerEditable();
    if (studyMusicActive()) playMusic();
    syncPlay();
    renderTimer(true);
  }

  function pauseTimer() {
    if (!T.running) return;
    T.remaining = Math.max(0, T.endAt - Date.now());
    T.running = false;
    clearInterval(T.id);
    setTimerEditable();
    if (studyMusicActive()) pauseMusic();
    syncPlay();
    renderTimer(true);
  }

  function tickTimer() {
    T.remaining = Math.max(0, T.endAt - Date.now());
    renderTimer();
    if (T.remaining <= 0) completeTimer();
  }

  function completeTimer() {
    T.running = false;
    clearInterval(T.id);
    T.remaining = 0;
    setTimerEditable();
    chime();
    const msg = S.study ? (T.phase === "focus" ? "Focus session complete" : "Break complete") : "Timer complete";
    notify(msg);
    if (studyMusicActive()) pauseMusic();
    syncPlay();
    renderTimer(true);
    if (S.study) {
      setTimeout(() => {
        if (!S.study || T.running) return;
        nextPhase();
        if (T.phase === "break" && S.autoBreak) startTimer();
      }, 1800);
    }
  }

  function resetTimer() {
    pauseTimer();
    T.remaining = T.len;
    renderTimer(true);
  }

  function addTime(sec) {
    if (S.study) return;
    const add = sec * 1000;
    if (T.running) {
      const next = clamp(Math.max(0, T.endAt - Date.now()) + add, 1000, MAX_MS);
      T.endAt = Date.now() + next;
      T.len = Math.max(T.len, next);
      T.remaining = next;
    } else {
      const next = clamp(T.remaining + add, 1000, MAX_MS);
      T.len = T.remaining = next;
      S.timerLen = next;
      save();
    }
    renderTimer(true);
    announceTime();
  }

  function announceTime() { $("#announce").textContent = `Timer set to ${fmtTimer(T.remaining)}`; }

  function commitInput() {
    if (T.running || S.study) { renderTimer(true); return; }
    const ms = parseTime(el.timeInput.value);
    if (ms) {
      T.len = T.remaining = ms;
      S.timerLen = ms;
      save();
    }
    renderTimer(true);
  }

  /* Study mode */
  function setStudy(on, silent) {
    pauseTimer();
    S.study = on;
    T.phase = "focus";
    T.session = 1;
    T.len = T.remaining = on ? FOCUS_MS : S.timerLen;
    if (!on) pauseMusic();
    $("#studyToggle").checked = on;
    el.presets.hidden = on || mode !== "timer";
    setTimerEditable();
    updateChip();
    renderTimer(true);
    if (!silent) save();
  }

  function nextPhase() {
    if (T.phase === "focus") { T.phase = "break"; T.len = BREAK_MS; }
    else { T.phase = "focus"; T.len = FOCUS_MS; T.session++; }
    T.remaining = T.len;
    updateChip();
    renderTimer(true);
  }

  function updateChip() {
    el.chip.hidden = !(S.study && mode === "timer");
    el.chip.textContent = T.phase === "focus" ? `Focus · Session ${T.session}` : "Break";
  }

  /* ---------- Stopwatch ---------- */
  const W = { elapsed: 0, startAt: 0, running: false, id: 0, laps: [], lastSec: -1 };

  function renderStopwatch() {
    const total = Math.floor(W.elapsed / 1000);
    const cs = Math.floor((W.elapsed % 1000) / 10);
    el.swTime.firstChild.nodeValue = `${Math.floor(total / 60)}:${pad(total % 60)}`;
    el.swCs.textContent = "." + pad(cs);
    if (mode === "stopwatch") {
      const frac = (W.elapsed % 60000) / 60000;
      el.ringFg.style.strokeDashoffset = String(1 - frac);
      el.ring.classList.toggle("empty", W.elapsed === 0);
      if (total !== W.lastSec) { W.lastSec = total; updateTitle(); }
    }
  }

  function startStopwatch() {
    if (W.running) return;
    W.running = true;
    W.startAt = performance.now() - W.elapsed;
    W.id = setInterval(() => { W.elapsed = performance.now() - W.startAt; renderStopwatch(); }, 50);
    syncPlay();
  }

  function pauseStopwatch() {
    if (!W.running) return;
    W.elapsed = performance.now() - W.startAt;
    W.running = false;
    clearInterval(W.id);
    renderStopwatch();
    syncPlay();
  }

  function resetStopwatch() {
    pauseStopwatch();
    W.elapsed = 0;
    W.laps = [];
    el.lapList.replaceChildren();
    el.lapList.hidden = true;
    renderStopwatch();
    syncPlay();
  }

  function recordLap() {
    if (!W.running) return;
    const total = performance.now() - W.startAt;
    const prev = W.laps.length ? W.laps[0].total : 0;
    W.laps.unshift({ total, split: total - prev });
    const n = W.laps.length;
    const li = document.createElement("li");
    const a = document.createElement("span"); a.className = "lap-n"; a.textContent = `Lap ${n}`;
    const b = document.createElement("span"); b.textContent = fmtSplit(total - prev);
    const c = document.createElement("span"); c.className = "lap-total"; c.textContent = fmtSplit(total);
    li.append(a, b, c);
    el.lapList.prepend(li);
    el.lapList.hidden = false;
    $("#announce").textContent = `Lap ${n}, ${fmtSplit(total - prev)}`;
  }

  /* ---------- Mode, play button, title ---------- */
  const running = () => (mode === "timer" ? T.running : W.running);

  function syncPlay() {
    const r = running();
    el.playUse.setAttribute("href", r ? "#i-pause" : "#i-play");
    const noun = mode === "timer" ? "timer" : "stopwatch";
    el.play.setAttribute("aria-label", `${r ? "Pause" : "Start"} ${noun}`);
    el.lap.disabled = !(mode === "stopwatch" && W.running);
    updateTitle();
  }

  function updateTitle() {
    if (mode === "timer" && T.running) document.title = `${fmtTimer(T.remaining)} · Timely`;
    else if (mode === "stopwatch" && W.running) document.title = `${Math.floor(W.elapsed / 60000)}:${pad(Math.floor(W.elapsed / 1000) % 60)} · Timely`;
    else document.title = BASE_TITLE;
  }

  function setMode(next, focusTab) {
    mode = next;
    el.tabs.forEach((t) => {
      const on = t.dataset.mode === next;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    el.timerView.hidden = next !== "timer";
    el.swView.hidden = next !== "stopwatch";
    el.presets.hidden = next !== "timer" || S.study;
    el.lapList.hidden = next !== "stopwatch" || !W.laps.length;
    el.lap.hidden = next !== "stopwatch";
    updateChip();
    if (next === "timer") renderTimer(true); else renderStopwatch();
    syncPlay();
    placeThumb(false);
  }

  function togglePlay() {
    if (mode === "timer") (T.running ? pauseTimer : startTimer)();
    else (W.running ? pauseStopwatch : startStopwatch)();
  }
  function resetCurrent() { if (mode === "timer") resetTimer(); else resetStopwatch(); }

  /* ---------- Liquid switcher (draggable glass thumb) ---------- */
  const seg = $('.seg[role="tablist"]');
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let suppressClick = false;
  const activeTab = () => el.tabs.find((t) => t.getAttribute("aria-selected") === "true") || el.tabs[0];

  function placeThumb(immediate) {
    const b = activeTab();
    if (immediate) seg.classList.add("no-anim");
    seg.style.setProperty("--x", b.offsetLeft + "px");
    seg.style.setProperty("--w", b.offsetWidth + "px");
    if (immediate) { void seg.offsetWidth; seg.classList.remove("no-anim"); }
  }

  function initSwitcher() {
    let drag = null;
    const first = el.tabs[0], last = el.tabs[el.tabs.length - 1];

    seg.addEventListener("pointerdown", (e) => {
      if (S.style !== "liquid" || (e.pointerType === "mouse" && e.button !== 0)) return;
      const b = activeTab();
      drag = { id: e.pointerId, sx: e.clientX, x0: b.offsetLeft, w: b.offsetWidth, x: b.offsetLeft, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
      seg.classList.add("pressed");
    });

    seg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      if (!drag.moved) {
        if (Math.abs(dx) < 4) return;
        drag.moved = true;
        try { seg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        seg.classList.add("dragging");
      }
      const min = first.offsetLeft, max = last.offsetLeft + last.offsetWidth - drag.w;
      drag.x = clamp(drag.x0 + dx, min, max);
      const dt = Math.max(1, e.timeStamp - drag.lastT);
      drag.v = drag.v * 0.7 + ((e.clientX - drag.lastX) / dt) * 0.3;
      drag.lastX = e.clientX; drag.lastT = e.timeStamp;
      seg.style.setProperty("--x", drag.x + "px");
      if (!reducedMotion.matches) seg.style.setProperty("--sx", String(1 + clamp(Math.abs(drag.v) * 0.2, 0, 0.3)));
    });

    const end = (e) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag;
      drag = null;
      seg.classList.remove("pressed", "dragging");
      seg.style.removeProperty("--sx");
      if (!d.moved) return; // plain tap: the tab's own click handler does the work
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 60);
      const center = d.x + d.w / 2;
      let best = el.tabs[0], bestDist = Infinity;
      el.tabs.forEach((t) => {
        const dist = Math.abs(t.offsetLeft + t.offsetWidth / 2 - center);
        if (dist < bestDist) { best = t; bestDist = dist; }
      });
      if (best.dataset.mode !== mode) setMode(best.dataset.mode); else placeThumb(false);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    seg.addEventListener("click", (e) => {
      if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
    }, true);

    if ("ResizeObserver" in window) new ResizeObserver(() => placeThumb(true)).observe(seg);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeThumb(true));
  }

  function applyStyle() {
    if (S.style === "standard") root.dataset.style = "standard"; else root.removeAttribute("data-style");
    $("#liquidStyle").checked = S.style !== "standard";
    placeThumb(true);
  }

  /* ---------- Appearance ---------- */
  function applyScheme() {
    if (S.scheme === "auto") root.removeAttribute("data-scheme"); else root.dataset.scheme = S.scheme;
    const r = document.querySelector(`input[name="scheme"][value="${S.scheme}"]`);
    if (r) r.checked = true;
  }

  function applyTheme() {
    const custom = S.theme === "custom" && S.custom;
    root.dataset.theme = custom ? "custom" : S.theme;
    if (custom) {
      root.style.setProperty("--accent", S.custom.accent);
      root.style.setProperty("--on-accent", S.custom.on);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--on-accent");
    }
    const r = document.querySelector(`input[name="accent"][value="${S.theme}"]`);
    if (r) r.checked = true;
    $("#customBox").hidden = S.theme !== "custom";
  }

  function buildSwatches() {
    const box = $("#swatches");
    const frag = document.createDocumentFragment();
    [...THEMES, "custom"].forEach((name) => {
      const label = document.createElement("label");
      label.className = "swatch" + (name === "custom" ? " is-custom" : "");
      if (name !== "custom") label.dataset.theme = name;
      const input = document.createElement("input");
      input.type = "radio"; input.name = "accent"; input.value = name;
      input.setAttribute("aria-label", name.charAt(0).toUpperCase() + name.slice(1));
      const dot = document.createElement("i");
      label.append(input, dot);
      frag.append(label);
    });
    box.append(frag);
    box.addEventListener("change", (e) => {
      const name = e.target.value;
      if (name === "custom" && !S.custom) {
        S.custom = customFromHsv(Number($("#hue").value), Number($("#sat").value), Number($("#val").value));
      }
      S.theme = name;
      applyTheme();
      if (name === "custom") syncCustomUI();
      save();
    });
  }

  function syncCustomUI() {
    const c = S.custom;
    if (!c) return;
    $("#hue").value = c.h; $("#sat").value = c.s; $("#val").value = c.v;
    const rgb = hexToRgb(c.accent), hsl = rgbToHsl(rgb.r, rgb.g, rgb.b), k = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    $("#o-hex").textContent = c.accent.toUpperCase();
    $("#o-rgb").textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    $("#o-hsl").textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
    $("#o-hsv").textContent = `${c.h}°, ${c.s}%, ${c.v}%`;
    $("#o-cmyk").textContent = `${k.c}%, ${k.m}%, ${k.y}%, ${k.k}%`;
  }

  function onCustomInput() {
    S.custom = customFromHsv(Number($("#hue").value), Number($("#sat").value), Number($("#val").value));
    S.theme = "custom";
    applyTheme();
    syncCustomUI();
    save();
  }

  /* ---------- Sound / music UI ---------- */
  function syncSoundUI() {
    $("#soundToggle").checked = S.sound;
    const btn = $("#muteBtn");
    btn.setAttribute("aria-pressed", String(S.sound));
    btn.setAttribute("aria-label", S.sound ? "Sound effects on" : "Sound effects off");
    $("#muteUse").setAttribute("href", S.sound ? "#i-speaker" : "#i-speaker-off");
    $("#volSlider").value = Math.round(S.vol * 100);
    $("#volText").textContent = Math.round(S.vol * 100) + "%";
    $("#musicToggle").checked = S.musicOn;
    $("#musicBox").hidden = !S.musicOn;
    $("#musicSlider").value = Math.round(S.music * 100);
    $("#musicText").textContent = Math.round(S.music * 100) + "%";
    $("#studyMusicToggle").checked = S.studyMusic;
    $("#autoBreak").checked = S.autoBreak;
    $("#studyToggle").checked = S.study;
    $("#liquidToggle").checked = S.liquid;
    $("#audioUrlInput").value = S.audioUrl || "";
  }

  function playCustomAudio() {
    const status = $("#audioUrlStatus");
    const btn = $("#audioPlay");
    if (custom) {
      custom.pause(); custom = null;
      btn.textContent = "Play"; status.textContent = "Stopped";
      return;
    }
    let url;
    try { url = new URL($("#audioUrlInput").value.trim()); } catch (e) { url = null; }
    if (!url || url.protocol !== "https:") { status.textContent = "Enter a link that starts with https://"; return; }
    status.textContent = "Loading…";
    const a = new Audio(url.href);
    a.loop = true;
    a.volume = musicVol() || 0.4;
    a.addEventListener("playing", () => { status.textContent = "Playing"; btn.textContent = "Stop"; }, { once: true });
    a.addEventListener("error", () => {
      status.textContent = "Couldn’t play that link. Check the address and try again.";
      custom = null; btn.textContent = "Play";
    }, { once: true });
    custom = a;
    S.audioUrl = url.href;
    save();
    a.play().catch(() => {});
  }

  /* ---------- Liquid Glass (opt-in, loads on demand) ---------- */
  let lg = null;
  async function setLiquid(on) {
    const dock = el.dock;
    if (on) {
      try {
        const gl = document.createElement("canvas").getContext("webgl");
        if (!gl) throw new Error("WebGL unavailable");
        const mod = await import("./vendor/liquidglass.min.js");
        dock.dataset.config = JSON.stringify({
          cornerRadius: 48, zRadius: 28, refraction: 0.55, blurAmount: 0.25,
          chromAberration: 0.04, edgeHighlight: 0.08, shadowOpacity: 0.18, shadowSpread: 14,
        });
        lg = await mod.LiquidGlass.init({ root: $("#stage"), glassElements: [dock] });
        dock.classList.add("lg");
      } catch (err) {
        S.liquid = false;
        $("#liquidToggle").checked = false;
        notify("Liquid Glass isn’t available on this device");
      }
    } else if (lg) {
      lg.destroy(); lg = null;
      dock.classList.remove("lg");
      delete dock.dataset.config;
    }
    save();
  }

  /* ---------- Events ---------- */
  function bind() {
    // Button click feedback (event delegation: one listener instead of one per button)
    document.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && !b.disabled) click();
    });

    el.play.addEventListener("click", togglePlay);
    el.reset.addEventListener("click", resetCurrent);
    el.lap.addEventListener("click", recordLap);

    // Mode tabs with arrow-key support
    el.tabs.forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
    $(".seg[role=tablist]").addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const order = el.tabs.map((t) => t.dataset.mode);
      let i = order.indexOf(mode);
      if (e.key === "ArrowRight") i = (i + 1) % order.length;
      else if (e.key === "ArrowLeft") i = (i - 1 + order.length) % order.length;
      else i = e.key === "Home" ? 0 : order.length - 1;
      setMode(order[i], true);
    });

    // Timer input
    el.timeInput.addEventListener("focus", () => { if (!el.timeInput.readOnly) el.timeInput.select(); });
    el.timeInput.addEventListener("change", commitInput);
    el.timeInput.addEventListener("blur", commitInput);
    el.timeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") el.timeInput.blur();
      else if (e.key === "Escape") { renderTimer(true); el.timeInput.blur(); }
      else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !el.timeInput.readOnly) {
        e.preventDefault();
        const base = parseTime(el.timeInput.value) || T.len;
        const ms = clamp(base + (e.key === "ArrowUp" ? 60000 : -60000), 1000, MAX_MS);
        el.timeInput.value = fmtTimer(ms);
        commitInput();
      }
    });

    // Presets
    PRESETS.forEach((sec) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button"; b.className = "pill";
      b.textContent = sec < 60 ? `+${sec} sec` : `+${sec / 60} min`;
      b.addEventListener("click", () => addTime(sec));
      li.append(b);
      el.presets.append(li);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if ($("#settings").open) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.matches("input, textarea, select") || t.isContentEditable);
      if (typing) return;
      const k = e.key.toLowerCase();
      if (e.key === " " && !(t instanceof HTMLElement && t.closest("button, a, [role=tab]"))) { e.preventDefault(); togglePlay(); }
      else if (k === "r") resetCurrent();
      else if (k === "l") recordLap();
      else if (k === "m") setMode(mode === "timer" ? "stopwatch" : "timer");
    });

    // Settings
    const dlg = $("#settings");
    $("#settingsBtn").addEventListener("click", () => dlg.showModal());
    $("#settingsClose").addEventListener("click", () => dlg.close());
    $("#settingsDone").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

    $(".seg-wide").addEventListener("change", (e) => {
      S.scheme = e.target.value; applyScheme(); save();
    });
    buildSwatches();
    ["hue", "sat", "val"].forEach((id) => $("#" + id).addEventListener("input", onCustomInput));

    const toggleSound = (on) => { S.sound = on; syncSoundUI(); save(); if (on) click(); };
    $("#soundToggle").addEventListener("change", (e) => toggleSound(e.target.checked));
    $("#muteBtn").addEventListener("click", () => toggleSound(!S.sound));
    $("#volSlider").addEventListener("input", (e) => {
      S.vol = e.target.value / 100; $("#volText").textContent = e.target.value + "%"; applyMusicVolume(); save();
    });
    $("#volSlider").addEventListener("change", click);
    $("#musicToggle").addEventListener("change", (e) => {
      S.musicOn = e.target.checked; $("#musicBox").hidden = !S.musicOn;
      if (S.musicOn) playMusic(); else pauseMusic();
      save();
    });
    $("#musicSlider").addEventListener("input", (e) => {
      S.music = e.target.value / 100; $("#musicText").textContent = e.target.value + "%"; applyMusicVolume(); save();
    });
    $("#studyToggle").addEventListener("change", (e) => setStudy(e.target.checked));
    $("#autoBreak").addEventListener("change", (e) => { S.autoBreak = e.target.checked; save(); });
    $("#studyMusicToggle").addEventListener("change", (e) => { S.studyMusic = e.target.checked; save(); });
    $("#audioPlay").addEventListener("click", playCustomAudio);
    $("#liquidStyle").addEventListener("change", (e) => { S.style = e.target.checked ? "liquid" : "standard"; applyStyle(); save(); });
    $("#liquidToggle").addEventListener("change", (e) => { S.liquid = e.target.checked; setLiquid(S.liquid); });

    $("#resetSettings").addEventListener("click", () => {
      if (!confirm("Reset all settings to their defaults?")) return;
      const wasStudy = S.study;
      pauseMusic();
      if (custom) { custom.pause(); custom = null; $("#audioPlay").textContent = "Play"; }
      if (S.liquid) setLiquid(false);
      S = { ...DEFAULTS };
      applyScheme(); applyTheme(); syncSoundUI(); applyStyle();
      $("#audioUrlStatus").textContent = "";
      if (wasStudy) setStudy(false, true);
      T.len = S.timerLen; if (!T.running) T.remaining = T.len;
      renderTimer(true);
      save();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (T.running) tickTimer();
        if (W.running) { W.elapsed = performance.now() - W.startAt; renderStopwatch(); }
      }
    });
  }

  /* ---------- Init ---------- */
  function init() {
    load();
    T.len = T.remaining = S.timerLen;
    const wantStudy = S.study;
    S.study = false;
    bind();
    initSwitcher();
    applyScheme();
    applyTheme();
    syncCustomUI();
    syncSoundUI();
    setMode("timer");
    applyStyle();
    if (wantStudy) setStudy(true, true);
    renderStopwatch();

    if (S.liquid) {
      const go = () => setLiquid(true);
      if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 1500);
    }

    if ("serviceWorker" in navigator && location.protocol === "https:") {
      window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  }

  init();
})();
