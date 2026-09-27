import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync("dist/content.js", "utf8"), ctx);
const { projects, certificates } = ctx.window.portfolioContent;
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const featured = [
  {
    id: "debugarena",
    image: "debugarena-scene.jpg",
    category: "EDTECH / OPEN SOURCE",
    caption: "Aprender a programar.<br>Investigando o que deu errado.",
    note: "24 investigações · Avaliação no servidor",
  },
  {
    id: "amx",
    image: "amxwatch-scene.webp",
    category: "E-COMMERCE / PRODUTO",
    caption: "Uma experiência de compra.<br>Conectada em cada detalhe.",
    note: "Catálogo · Pagamentos · Frete",
  },
];
let projectHTML = featured
  .map((f, i) => {
    const p = projects.find((p) => p.id === f.id);
    return `<article class="feature-project project-${p.id}" id="projeto-${p.id}"><div class="project-surface"><img src="assets/${f.image}" alt="" width="1536" height="1024" loading="lazy"><span class="project-overline">0${i + 1} / ${f.category}</span><div class="project-cover-copy"><h3>${escape(p.name)}</h3><p>${f.caption}</p><span class="cover-tags">${p.tags
      .slice(0, 3)
      .map((t) => `<span>${escape(t)}</span>`)
      .join(
        "",
      )}</span></div><button class="surface-open" data-project="${p.id}" aria-label="Explorar estudo de caso de ${escape(p.name)}"><span class="project-open" aria-hidden="true">↗</span></button></div><div class="project-bottom"><button data-project="${p.id}">Explorar estudo de caso <span>↗</span></button><span>${f.note}</span><a href="${p.url}" target="_blank" rel="noopener">Abrir projeto ↗</a></div></article>`;
  })
  .join("");
const rest = projects.filter((p) => !featured.some((f) => f.id === p.id));
projectHTML += `<div class="other-work"><div class="other-work-heading"><span>OUTRAS EXPLORAÇÕES</span><span>04 PROJETOS</span></div><div class="project-list">${rest.map((p, i) => `<article class="project-row" id="projeto-${p.id}"><span class="project-row-index">0${i + 3}</span><h3><button data-project="${p.id}">${escape(p.name)}</button></h3><p>${p.tags.slice(0, 3).map(escape).join(" / ")}</p><div class="row-actions"><a href="${p.url}" target="_blank" rel="noopener">Visitar ↗</a><button data-project="${p.id}" aria-label="Explorar estudo de caso de ${escape(p.name)}">+</button></div></article>`).join("")}</div></div>`;
const certificateHTML = certificates
  .map(
    (c, i) =>
      `<a class="certificate" href="assets/${c.image}" data-certificate="${i}" aria-label="Abrir certificado: ${escape(c.name)}"><span><strong>${escape(c.name)}</strong><small>${i === 0 ? "FIAP · 80 HORAS · 2026" : `DEV CLUB · ${escape(c.meta)}`}</small></span><span class="cert-arrow" aria-hidden="true">↗</span></a>`,
  )
  .join("");
let html = readFileSync("dist/index.html", "utf8");
html = html
  .replace(
    /<!-- PROJECTS:START -->[\s\S]*?<!-- PROJECTS:END -->/,
    `<!-- PROJECTS:START -->${projectHTML}<!-- PROJECTS:END -->`,
  )
  .replace(
    /<!-- CERTIFICATES:START -->[\s\S]*?<!-- CERTIFICATES:END -->/,
    `<!-- CERTIFICATES:START -->${certificateHTML}<!-- CERTIFICATES:END -->`,
  );
writeFileSync("dist/index.html", html);
console.log("Rendered 6 projects and 9 certificates into HTML.");
