import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
const html = readFileSync("dist/index.html", "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync("dist/content.js", "utf8"), ctx);
const { projects, certificates } = ctx.window.portfolioContent;
const errors = [];
for (const p of projects) {
  if (!html.includes(p.name)) errors.push(`Missing project: ${p.name}`);
  if (!existsSync(`dist/assets/${p.image}`)) errors.push(p.image);
  if (p.blocks.length !== 4) errors.push(`Incomplete case study: ${p.name}`);
}
for (const c of certificates) {
  if (!existsSync(`dist/assets/${c.image}`)) errors.push(c.image);
}
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (url.startsWith("#") && !html.includes(`id="${url.slice(1)}"`))
    errors.push(`Broken anchor: ${url}`);
  else if (
    !/^(?:https?:|mailto:|tel:|data:|#)/.test(url) &&
    !existsSync(`dist/${url}`)
  )
    errors.push(`Missing asset: ${url}`);
}
if (projects.length !== 6 || certificates.length !== 9)
  errors.push("Incorrect content totals");
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Verified: 6 projects, 24 case-study blocks, 9 certificates, all internal anchors and local assets.",
);
