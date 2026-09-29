import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const sculpture = readFileSync(new URL("../dist/sculpture.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../dist/interactions.css", import.meta.url), "utf8");

test("portfolio motion adds an accessible pointer accent and theme transition", () => {
  assert.match(app, /cursor-signal/);
  assert.match(app, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(sculpture, /theme-changing/);
  assert.match(sculpture, /hero-pointer-y/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("case studies compare only existing identity and presentation assets", () => {
  for (const asset of ["debugarena-scene.jpg", "amxwatch-scene.webp", "acf-scene.webp", "milecar-scene.webp"])
    assert.ok(app.includes(asset), `missing comparison for ${asset}`);
  assert.match(app, /data-compare-range/);
  assert.match(app, /identidade visual e imagem do projeto/i);
  assert.match(styles, /\.case-compare-frame:focus-within/);
});

test("trajectory, certificates, Laís, and contact gain contextual interactions", () => {
  assert.match(app, /timeline-progress/);
  assert.match(app, /certificate-peek/);
  assert.match(app, /questionSets/);
  assert.match(app, /contact-in-view/);
  assert.match(styles, /\.timeline-rail/);
  assert.match(styles, /\.contact-in-view::before/);
});
