import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync("../Portifolio/index.html", "utf8");
const clean = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const match = (s, re) => s.match(re)?.[1] ?? "";
const projects = [
  ...source.matchAll(/<article class="projeto-card[\s\S]*?<\/article>/g),
].map(({ 0: s }) => ({
  id: match(s, /data-caso="([^"]+)"/),
  name: clean(match(s, /<h3 class="projeto-titulo">([\s\S]*?)<\/h3>/)),
  description: clean(match(s, /<p class="projeto-descricao">([\s\S]*?)<\/p>/)),
  image: match(s, /<img src="([^"]+)"/),
  url: match(s, /<a href="(https:[^"]+)" class="projeto-link"/),
  repo: match(s, /<a href="(https:\/\/github.com\/[^"]+)"/),
  tags: [...s.matchAll(/<span class="tag">([^<]+)<\/span>/g)].map((x) =>
    clean(x[1]),
  ),
  blocks: [
    ...s.matchAll(
      /<p class="caso-rot">([\s\S]*?)<\/p>\s*<p class="caso-txt">([\s\S]*?)<\/p>/g,
    ),
  ].map((x) => ({ title: clean(x[1]), text: clean(x[2]) })),
  status: clean(match(s, /<p class="caso-estado[^\"]*">([\s\S]*?)<\/p>/)),
}));
const certificates = [
  ...source.matchAll(/<article class="certificado-card[\s\S]*?<\/article>/g),
].map(({ 0: s }) => ({
  name: clean(match(s, /<span class="certificado-nome">([\s\S]*?)<\/span>/)),
  meta: clean(match(s, /<span class="certificado-emissor">([\s\S]*?)<\/span>/)),
  image: match(s, /<img src="([^"]+)"/),
  verify: match(s, /<a class="certificado-verificar"\s+href="([^"]+)"/),
}));
if (
  projects.length !== 6 ||
  certificates.length !== 9 ||
  projects.some((p) => !p.id || !p.url || p.blocks.length !== 4)
)
  throw Error("Conteúdo incompleto");
writeFileSync(
  "dist/content.js",
  `window.portfolioContent = ${JSON.stringify({ projects, certificates }, null, 2)};\n`,
);
console.log(
  `Importados ${projects.length} projetos, ${certificates.length} certificados e ${projects.reduce((n, p) => n + p.blocks.length, 0)} blocos de estudo de caso.`,
);
