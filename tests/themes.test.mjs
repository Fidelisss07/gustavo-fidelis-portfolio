import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const css = readFileSync("dist/style.css", "utf8");
const interactions = readFileSync("dist/interactions.css", "utf8");
const app = readFileSync("dist/app.js", "utf8");
const sculpture = readFileSync("dist/sculpture.js", "utf8");
const themes = ["blue", "purple", "red", "pink", "orange", "cyan", "yellow", "green"];

test("the theme picker exposes eight named, keyboard-operable palettes", () => {
  const buttons = [...html.matchAll(/data-theme-select="([a-z]+)"[^>]*aria-pressed="(true|false)"[^>]*aria-label="([^"]+)"/g)];
  assert.deepEqual(buttons.map(([, id]) => id), themes);
  assert.equal(buttons.filter(([, , pressed]) => pressed === "true").length, 1);
  assert.match(html, /<body data-theme="blue">/);
  assert.match(html, /id="theme-status" role="status" aria-live="polite"/);
});

test("every palette changes site accents and has its own WebGL material and sculpture", () => {
  for (const theme of themes.slice(1)) {
    assert.ok(css.includes(`body[data-theme="${theme}"]`), `${theme} CSS palette`);
    assert.match(sculpture, new RegExp(`^\\s*${theme}: \\{`, "m"), `${theme} material`);
    assert.ok(app.includes(`["${theme}"`), `${theme} picker label`);
  }
  assert.match(sculpture, /if \(theme === "purple"\)/);
  assert.match(sculpture, /if \(theme === "red"\)/);
  assert.match(sculpture, /if \(theme === "pink"\)/);
  assert.match(sculpture, /if \(theme === "orange" \|\| theme === "cyan"\)/);
  assert.match(sculpture, /if \(theme === "yellow"\)/);
  assert.match(sculpture, /if \(theme === "green"\)/);
  assert.match(sculpture, /theme === "blue"\) return \{ positions: new Float32Array\(positions\)/);
});

test("theme choice is persisted and announces the matching palette", () => {
  assert.match(app, /gustavo-portfolio-theme/);
  assert.match(app, /portfolio:themechange/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /themePicker\.open = false/);
});

test("Laís accents follow the active palette instead of staying blue", () => {
  for (const theme of themes.slice(1))
    assert.match(css, new RegExp(`body\\[data-theme="${theme}"\\][\\s\\S]*?--lais-hue:`));
  assert.match(css, /\.lais-primary:not\(:disabled\)[\s\S]*?background: var\(--blue\)/);
  assert.match(css, /\.lais-message\.from-user[\s\S]*?color-mix\(in srgb, var\(--blue\)/);
  assert.match(css, /body\[data-theme\] \.lais-mini-orb,[\s\S]*?filter: hue-rotate\(var\(--lais-hue\)\)/);
});

test("contact and interactive accents use the selected palette", () => {
  assert.match(css, /\.contact \{[\s\S]*?background: var\(--blue\)/);
  assert.match(css, /\.button-primary:hover \{\s*background: var\(--blue-bright\)/);
  assert.doesNotMatch(css, /\.contact \{[^}]*background:\s*#[\da-f]{3,8}/i);
  assert.match(interactions, /\.project-toggle:hover \{[\s\S]*?color: var\(--blue-deep\)/);
  assert.match(interactions, /\.system-aura[\s\S]*?var\(--blue\)/);
  assert.match(interactions, /\.orbital-spark[\s\S]*?var\(--blue-light\)/);
  assert.doesNotMatch(interactions, /#(?:dfe6ff|164bea|2359e329|477aff|cfdeff)/i);
});

test("the hero sculpture uses clearly visible continuous movement", () => {
  assert.match(sculpture, /elapsed \* 0\.22 \+ currentX/);
  assert.match(sculpture, /Math\.sin\(elapsed \* 0\.34\)/);
  assert.match(sculpture, /Math\.sin\(elapsed \* 0\.46\)/);
  assert.match(sculpture, /prefers-reduced-motion: reduce/);
});
