// A deterministic ribbon field. Conversation state changes its flow, not microphone data.
export function drawSilk(ctx, width, height, phase = 0, energy = 0) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  const scale = Math.min(width / 7.5, height / 6.5);
  const turn = -.38 + Math.sin(phase * .22) * .14;
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, height * .52);
  halo.addColorStop(0, "rgba(67,85,214,.03)");
  halo.addColorStop(.55, "rgba(65,104,235,.12)");
  halo.addColorStop(1, "rgba(65,104,235,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.globalCompositeOperation = "screen";
  for (let strand = 0; strand < 38; strand++) {
    const band = strand / 37;
    const offset = (band - .5) * .75;
    const gradient = ctx.createLinearGradient(-width * .3, -height * .3, width * .3, height * .35);
    const alpha = .24 + Math.sin(band * Math.PI) * .4;
    gradient.addColorStop(0, `rgba(104,220,255,${alpha})`);
    gradient.addColorStop(.38, `rgba(164,190,255,${alpha})`);
    gradient.addColorStop(.65, `rgba(85,117,255,${alpha})`);
    gradient.addColorStop(1, `rgba(172,137,250,${alpha})`);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(.45, scale * .023);
    ctx.beginPath();
    for (let step = 0; step <= 220; step++) {
      const a = step / 220 * Math.PI * 2;
      const twist = a * 3 + phase * .35;
      const radius = 1.95 + .62 * Math.cos(a * 3) + offset * Math.cos(twist);
      const ripple = energy * .12 * Math.sin(a * 5 - phase * 2);
      const x = (radius + ripple) * Math.cos(a * 2);
      const y = (radius + ripple) * Math.sin(a * 2);
      const z = .72 * Math.sin(a * 3) + offset * Math.sin(twist);
      const py = y * .8 + z * .85;
      const px = (x * Math.cos(turn) - py * Math.sin(turn)) * scale;
      const sy = (x * Math.sin(turn) + py * Math.cos(turn)) * scale;
      if (step === 0) ctx.moveTo(px, sy); else ctx.lineTo(px, sy);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

export function mountLaisVisual(panel) {
  const host = panel.querySelector(".lais-orb");
  if (!host) return;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  host.append(canvas);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = 200, height = 132;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  // Same signature in the launcher, drawn once rather than another animation loop.
  const miniature = document.querySelector(".lais-mini-orb");
  if (miniature) {
    const mini = document.createElement("canvas");
    mini.width = mini.height = 80;
    mini.setAttribute("aria-hidden", "true");
    const miniContext = mini.getContext("2d");
    if (miniContext) { drawSilk(miniContext, 80, 80, .4); miniature.append(mini); }
  }
  let frame = 0, last = 0, phase = .4, energy = 0, visible = false;
  const paused = () => reduced.matches || document.body.classList.contains("motion-paused");
  function render(now) {
    frame = 0;
    if (!panel.open || document.hidden || !visible) return;
    const elapsed = last ? Math.min((now - last) / 1000, .06) : 0;
    if (last && elapsed < 1 / 30 && !paused()) {
      frame = requestAnimationFrame(render); return;
    }
    last = now;
    const target = { speaking: 1, listening: .4, connecting: .65 }[panel.dataset.state] || 0;
    energy += (target - energy) * (1 - Math.exp(-elapsed * 4));
    if (!paused()) phase += elapsed * (.25 + energy * .9);
    drawSilk(ctx, width, height, phase, paused() ? 0 : energy);
    if (!paused()) frame = requestAnimationFrame(render);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (panel.open && !document.hidden && visible) frame = requestAnimationFrame(render);
  }
  const observer = new MutationObserver(sync);
  observer.observe(panel, { attributes: true, attributeFilter: ["open", "data-state"] });
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  intersection.observe(host);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  drawSilk(ctx, width, height, phase);
  return () => {
    cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
  };
}
