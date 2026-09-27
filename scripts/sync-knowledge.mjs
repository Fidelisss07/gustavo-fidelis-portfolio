import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import vm from "node:vm";
const dir = resolve("lais/knowledge");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString();
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync("dist/content.js", "utf8"), ctx);
const { projects, certificates } = ctx.window.portfolioContent;
const html = readFileSync("dist/index.html", "utf8");
const plain = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const about =
  html.match(/<section\s+class="about[\s\S]*?<\/section>/)?.[0] || "";
const trajectory =
  html.match(/<section\s+class="trajectory[\s\S]*?<\/section>/)?.[0] || "";
const text = [
  "# Portfólio de Gustavo Fidelis",
  "Captura: " + stamp,
  "Fonte: https://github.com/Fidelisss07/Portifolio e conteúdo local revisado do portfólio.",
  "Site: https://gustavo-fidelis-portfolio-astra.fidelis07dev.chatgpt.site/",
  "Os estados de entrega abaixo são declarações do portfólio, não verificações de produção em tempo real.",
  "## Sobre e trajetória",
  plain(about),
  plain(trajectory),
  ...projects.map((p) =>
    [
      "## " + p.name,
      "URL: " + p.url,
      "Repositório: " + (p.repo || "privado; não disponível para consulta"),
      p.description,
      "Tecnologias: " + p.tags.join(", "),
      ...p.blocks.map((b) => "### " + b.title + "\n" + b.text),
      "Situação declarada: " + p.status,
    ].join("\n\n"),
  ),
  "## Certificados",
  ...certificates.map(
    (c) => c.name + " — " + c.meta + (c.verify ? " — " + c.verify : ""),
  ),
  "## Contato profissional",
  "E-mail: gufidelis116@gmail.com",
  "LinkedIn: https://www.linkedin.com/in/gustavo-fidelis-b17051387/",
  "GitHub: https://github.com/Fidelisss07",
  "## Limites",
  "Não há confirmação de pretensão salarial, disponibilidade de horários, regime de contratação desejado ou senioridade. O link para o LinkedIn não equivale a acesso ao seu conteúdo.",
].join("\n\n");
writeFileSync(resolve(dir, "portfolio.md"), text);
const bundled = resolve(
  process.env.LOCALAPPDATA || ".",
  "../..",
  ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
);
const python =
  process.env.LAIS_PYTHON || (existsSync(bundled) ? bundled : "python");
const pdf = resolve("dist/assets/curriculo_gustavo_fidelis_final.pdf");
const result = spawnSync(
  python,
  [
    "-c",
    "import sys,json; from pypdf import PdfReader; print(json.dumps('\\n'.join(p.extract_text() for p in PdfReader(sys.argv[1]).pages), ensure_ascii=True))",
    pdf,
  ],
  { encoding: "utf8", windowsHide: true },
);
if (result.status !== 0)
  throw Error(
    "Falha ao extrair currículo. Instale pypdf no Python ou defina LAIS_PYTHON. A captura anterior do currículo foi preservada.",
  );
writeFileSync(
  resolve(dir, "curriculo.md"),
  "# Currículo — Gustavo Fidelis\n\nFonte: PDF público do portfólio\nCaptura: " +
    stamp +
    "\nSHA256: " +
    createHash("sha256").update(readFileSync(pdf)).digest("hex") +
    "\n\n" +
    JSON.parse(result.stdout),
);
async function github(path) {
  const r = await fetch("https://api.github.com" + path, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "GustavoFidelis-Portfolio-Knowledge",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw Error(
      "GitHub retornou " + r.status + "; captura anterior preservada.",
    );
  return r.json();
}
const profile = await github("/users/Fidelisss07");
const repos = await github(
  "/users/Fidelisss07/repos?per_page=100&sort=updated",
);
const facts = [
  "# GitHub público de Gustavo Fidelis",
  "Fonte: https://github.com/Fidelisss07",
  "Captura: " + stamp,
  "Nome declarado: " + (profile.name || profile.login),
  "Bio declarada: " + (profile.bio || "não preenchida"),
  "Metadados de até 100 repositórios públicos. Não equivalem a auditoria de código, autoria exclusiva ou prova de proficiência.",
];
for (const r of repos)
  facts.push(
    "## " +
      r.name +
      "\nURL: " +
      r.html_url +
      "\nDescrição: " +
      (r.description || "Não informada") +
      "\nLinguagem principal: " +
      (r.language || "Não informada") +
      "\nFork: " +
      r.fork +
      "\nArquivado: " +
      r.archived +
      "\nAtualização declarada pelo GitHub: " +
      r.updated_at,
  );
writeFileSync(resolve(dir, "github.md"), facts.join("\n\n"));
console.log(
  "Capturas locais atualizadas: portfólio, currículo e GitHub. LinkedIn e base complementar aguardam conteúdo aprovado. Nada foi enviado à ElevenLabs.",
);
