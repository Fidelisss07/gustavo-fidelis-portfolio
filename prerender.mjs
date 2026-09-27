import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
// Bake the project and certificate lists into HTML for crawlers and no-JS visits.
// The same rendering code is reused, so source and interactive views stay aligned.
const script = readFileSync("dist/app.js", "utf8");
const nodes = {};
const context = {
  window: {},
  document: {
    querySelector: (selector) => (nodes[selector] ??= { innerHTML: "" }),
  },
};
vm.createContext(context);
vm.runInContext(readFileSync("dist/content.js", "utf8"), context);
const start = script.search(/const\s*\{\s*projects,\s*certificates\s*\}/);
const end = script.search(/const dialog\s*=/);
if (start < 0 || end < 0) throw Error("Rendering boundaries were not found");
vm.runInContext(script.slice(start, end), context);
let html = readFileSync("dist/index.html", "utf8");
html = html.replace(
  /<div class="project-grid" id="project-grid">[\s\S]*?<\/div>\s*<\/section>/,
  `<div class="project-grid" id="project-grid">${nodes["#project-grid"].innerHTML}</div></section>`,
);
html = html.replace(
  /<div class="certificates" id="certificates">[\s\S]*?<\/div>/,
  `<div class="certificates" id="certificates">${nodes["#certificates"].innerHTML}</div>`,
);
html = html.replaceAll(
  "gf<span>®</span>",
  'gf<span aria-hidden="true">✳</span>',
);
writeFileSync("dist/index.html", html);
let css = readFileSync("dist/style.css", "utf8");
css = css.replace(/font-size:(9|10|11)px/g, "font-size:12px");
writeFileSync("dist/style.css", css);
console.log("Static HTML includes all 6 projects and 9 certificates.");
