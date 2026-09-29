import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const sculpture = readFileSync(new URL("../dist/sculpture.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../dist/style.css", import.meta.url), "utf8");

test("the new three-stage method route is navigable and accessible", () => {
  assert.match(html, /<section class="method section-shell" id="metodo"/);
  assert.equal((html.match(/data-method-step="\d"/g) || []).length, 3);
  assert.match(html, /aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(app, /aria-pressed.*String\(active\)/);
  assert.match(app, /methodDetail\.querySelector\("p"\)\.textContent = copy/);
});

test("the hero sculpture and reflected light follow the pointer across the hero", () => {
  assert.match(sculpture, /hero\.addEventListener\("pointermove"/);
  assert.match(sculpture, /currentX \* 0\.9/);
  assert.match(sculpture, /currentY \* 0\.62/);
  assert.match(sculpture, /pointerLightLocation/);
  assert.match(sculpture, /model\[13\].*= Math\.sin/);
});

test("scroll progress and reduced-motion-aware visual refinements exist", () => {
  assert.match(html, /class="page-progress"/);
  assert.match(app, /pageProgress\.style\.transform =[\s\S]{0,35}"scaleX\(/);
  assert.match(styles, /\.project-surface \{ transform: none !important; \}/);
  assert.match(styles, /stroke-dasharray: 200%;[\s\S]*stroke-dashoffset: calc\(\(1 - var\(--route-progress\)\) \* 200%\)/);
});
