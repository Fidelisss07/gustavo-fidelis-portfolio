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
const explorations = [
  {
    id: "balu",
    image: "balu3d-logo.webp",
    logo: true,
    category: "E-COMMERCE / IMPRESSÃO 3D",
    caption: "Da ideia ao objeto.<br>Da vitrine ao checkout.",
    note: "Catálogo · Checkout · Administração",
  },
  {
    id: "acf",
    image: "acf-scene.webp",
    category: "AUTOMOTIVO / PERFORMANCE",
    caption: "Performance na pista.<br>Precisão na interface.",
    note: "11 páginas · Catálogo · Orçamento",
  },
  {
    id: "milecar",
    image: "milecar-scene.webp",
    category: "AUTOMOTIVO / EXPERIÊNCIA DIGITAL",
    caption: "Uma nova perspectiva.<br>Para encontrar o próximo carro.",
    note: "Identidade · Catálogo · Experiência",
  },
  {
    id: "tcar",
    image: "tcar-logo.webp",
    logo: true,
    category: "AUTOMOTIVO / CATÁLOGO",
    caption: "O próximo destino.<br>Começa com uma boa escolha.",
    note: "Busca · Filtros · Integrações",
  },
];
function renderProject(f, i, expanded) {
  const p = projects.find((project) => project.id === f.id);
  const name = escape(p.name);
  const panelId = `preview-${p.id}`;
  return `<article class="feature-project project-${p.id} project-disclosure${expanded ? " is-expanded" : ""}" id="projeto-${p.id}">
    <div class="project-row">
      <span class="project-row-index">0${i + 1}</span>
      <h3><button data-toggle-project="${p.id}" aria-expanded="${expanded}" aria-controls="${panelId}">${name}</button></h3>
      <p>${p.tags.slice(0, 3).map(escape).join(" / ")}</p>
      <div class="row-actions"><a href="${p.url}" target="_blank" rel="noopener">Visitar ↗</a><button class="project-toggle" data-toggle-project="${p.id}" data-project-name="${name}" aria-expanded="${expanded}" aria-controls="${panelId}" aria-label="${expanded ? "Ocultar" : "Expandir"} prévia de ${name}"><span aria-hidden="true">${expanded ? "−" : "+"}</span></button></div>
    </div>
    <div class="project-panel" id="${panelId}" role="region" aria-label="Prévia de ${name}">
      <div class="project-panel-clip"><div class="project-panel-content">
        <div class="project-surface${f.logo ? " brand-surface" : ""}">
          <img src="assets/${f.image}" alt="${f.logo ? "Marca" : "Imagem de apresentação"} do projeto ${name}" width="1536" height="1024" loading="lazy">
          <span class="project-overline">0${i + 1} / ${f.category}</span>
          <div class="project-cover-copy"><h3>${name}</h3><p>${f.caption}</p><span class="cover-tags">${p.tags
            .slice(0, 3)
            .map((t) => `<span>${escape(t)}</span>`)
            .join("")}</span></div>
          <button class="surface-open" data-project="${p.id}" aria-label="Explorar estudo de caso de ${name}"><span class="project-open" aria-hidden="true">↗</span></button>
        </div>
        <div class="project-bottom"><button data-project="${p.id}">Explorar estudo de caso <span>↗</span></button><span>${f.note}</span><a href="${p.url}" target="_blank" rel="noopener">Abrir projeto ↗</a></div>
      </div></div>
    </div>
  </article>`;
}
const projectHTML =
  featured.map((f, i) => renderProject(f, i, true)).join("") +
  `<div class="other-work"><div class="other-work-heading"><span>OUTRAS EXPLORAÇÕES</span><span>04 PROJETOS</span></div><div class="project-list">${explorations.map((f, i) => renderProject(f, i + 2, false)).join("")}</div></div>`;
const certificateHTML = ["FIAP", "DEV CLUB"]
  .map((issuer) => {
    const group = certificates.map((c, i) => ({ c, i })).filter(({ c }) => c.meta.includes(issuer));
    return `<div class="certificate-group-heading"><h4>${issuer}</h4><span>${String(group.length).padStart(2, "0")} certificados</span></div>` + group.map(({ c, i }, position) =>
      `<a class="certificate credential-card" href="assets/${c.image}" data-certificate="${i}" aria-label="Abrir certificado: ${escape(c.name)}"><span class="credential-document" aria-hidden="true"><img src="assets/${c.image}" alt="" loading="lazy" width="320" height="180"><span class="credential-index">${String(position + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}</span></span><span class="credential-copy"><strong>${escape(c.name)}</strong><small>${escape(c.meta)}</small></span><span class="credential-footer"><span>Ver certificado completo</span><span class="credential-open" aria-hidden="true">↗</span></span></a>`
    ).join("");
  })
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
  )
  .replace(
    /<!-- CERTIFICATE-COUNT -->\d+ CERTIFICADOS/,
    `<!-- CERTIFICATE-COUNT -->${String(certificates.length).padStart(2, "0")} CERTIFICADOS`,
  );
writeFileSync("dist/index.html", html);
console.log(`Rendered ${projects.length} projects and ${certificates.length} certificates into HTML.`);
