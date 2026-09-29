const time = document.querySelector("#local-time");
function updateTime() {
  time.textContent = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
updateTime();
setInterval(updateTime, 60000);

const themeOptions = [
  ["blue", "Azul", "escultura original"],
  ["purple", "Violeta", "prisma"],
  ["red", "Vermelho", "fita torcida"],
  ["pink", "Rosa", "flor de luz"],
  ["orange", "Laranja", "anel ondulado"],
  ["cyan", "Ciano", "toróide ripado"],
  ["yellow", "Amarelo", "astro facetado"],
  ["green", "Verde", "forma foliar"],
];
const themePicker = document.querySelector("#theme-picker");
const themeButtons = [...document.querySelectorAll("[data-theme-select]")];
const themeName = document.querySelector("#theme-current-name");
const themeStatus = document.querySelector("#theme-status");
const themesById = new Map(themeOptions.map(([id, name, shape]) => [id, { id, name, shape }]));
function applyTheme(id, persist = true) {
  const theme = themesById.get(id) || themesById.get("blue");
  document.body.dataset.theme = theme.id;
  themeName.textContent = theme.name;
  themeStatus.textContent = `${theme.name} · ${theme.shape}`;
  themeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeSelect === theme.id));
  });
  if (persist) {
    try { localStorage.setItem("gustavo-portfolio-theme", theme.id); } catch {}
  }
  document.dispatchEvent(new CustomEvent("portfolio:themechange", { detail: { id: theme.id } }));
}
let savedTheme = "blue";
try { savedTheme = localStorage.getItem("gustavo-portfolio-theme") || "blue"; } catch {}
applyTheme(savedTheme, false);
themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.themeSelect);
    themePicker.open = false;
    themePicker.querySelector("summary").focus();
  });
});
document.addEventListener("click", (event) => {
  if (themePicker.open && !themePicker.contains(event.target)) themePicker.open = false;
});

const { projects, certificates } = window.portfolioContent;
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const dialog = document.querySelector("#detail-dialog");
const dialogContent = document.querySelector("#dialog-content");
let previousFocus;
function showDialog(html) {
  previousFocus = document.activeElement;
  dialogContent.innerHTML = html;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add("modal-open");
}
function openProject(id) {
  const p = projects.find((project) => project.id === id);
  if (!p) return;
  const comparisonScenes = {
    debugarena: "debugarena-scene.jpg",
    amx: "amxwatch-scene.webp",
    acf: "acf-scene.webp",
    milecar: "milecar-scene.webp",
  };
  const scene = comparisonScenes[p.id];
  const comparison = scene
    ? `<section class="case-compare" aria-label="Comparação visual do projeto"><div class="case-compare-frame" style="--compare-position:50%"><img class="compare-scene" src="assets/${scene}" alt="Imagem de apresentação de ${escapeHTML(p.name)}" loading="lazy"><div class="compare-identity"><img src="assets/${escapeHTML(p.image)}" alt="Identidade visual de ${escapeHTML(p.name)}" loading="lazy"></div><span class="compare-divider" aria-hidden="true"></span><input data-compare-range type="range" min="12" max="88" value="50" aria-label="Arraste para comparar identidade visual e imagem do projeto"></div><div class="case-compare-legend"><span>Identidade visual</span><span>Imagem do projeto</span></div></section>`
    : "";
  showDialog(
    `<p class="section-kicker">ESTUDO DE CASO / ${escapeHTML(p.tags[0])}</p><h2 id="dialog-title">${escapeHTML(p.name)}</h2><p class="dialog-intro">${escapeHTML(p.description)}</p><div class="dialog-tags">${p.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div>${comparison}<div class="case-blocks">${p.blocks.map((b, index) => `<section style="--case-index:${index}"><h3>${escapeHTML(b.title)}</h3><p>${escapeHTML(b.text)}</p></section>`).join("")}</div><p class="case-status"><strong>Situação registrada no portfólio original</strong>${escapeHTML(p.status)}</p><div class="dialog-links"><a class="button-primary" href="${p.url}" target="_blank" rel="noopener">Abrir projeto ↗</a>${p.repo ? `<a class="inline-link" href="${p.repo}" target="_blank" rel="noopener">Código no GitHub ↗</a>` : '<span class="private-repo">Repositório privado</span>'}</div>`,
  );
}
dialogContent.addEventListener("input", (event) => {
  const range = event.target.closest("[data-compare-range]");
  if (range) range.parentElement.style.setProperty("--compare-position", `${range.value}%`);
});
document.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-toggle-project]");
  if (toggle) {
    const article = toggle.closest(".project-disclosure");
    const expanded = !article.classList.contains("is-expanded");
    article.classList.toggle("is-expanded", expanded);
    article.querySelector(".project-panel").inert = !expanded;
    article.querySelectorAll("[data-toggle-project]").forEach((button) => {
      button.setAttribute("aria-expanded", String(expanded));
      if (button.classList.contains("project-toggle")) {
        button.setAttribute(
          "aria-label",
          (expanded ? "Ocultar" : "Expandir") +
            " prévia de " +
            button.dataset.projectName,
        );
        button.querySelector("span").textContent = expanded ? "−" : "+";
      }
    });
    scheduleScroll();
  }
  const project = event.target.closest("[data-project]");
  if (project) openProject(project.dataset.project);
  const cert = event.target.closest("[data-certificate]");
  if (cert) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    const c = certificates[Number(cert.dataset.certificate)];
    showDialog(
      `<p class="section-kicker">FORMAÇÃO COMPLEMENTAR</p><h2 id="dialog-title">${escapeHTML(c.name)}</h2><p class="dialog-intro">${Number(cert.dataset.certificate) === 0 ? "FIAP" : "Dev Club"} · ${escapeHTML(c.meta)}</p><img class="certificate-image" src="assets/${c.image}" alt="Certificado de ${escapeHTML(c.name)}"><div class="dialog-links"><a class="inline-link" href="assets/${c.image}" target="_blank" rel="noopener">Abrir imagem original ↗</a>${c.verify ? `<a class="inline-link" href="${c.verify}" target="_blank" rel="noopener">Verificar autenticidade ↗</a>` : ""}</div>${Number(cert.dataset.certificate) === 0 ? '<p class="certificate-key">Chave FIAP: EFD06F5C033939B56E8074C87D070B1D</p>' : ""}`,
    );
  }
});
document
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  previousFocus?.focus({ preventScroll: true });
});

let quantity = 1;
const money = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n,
  );
const payment = () =>
  document.querySelector('input[name="payment"]:checked').value;
const total = () =>
  Math.round(14990 * quantity * (payment() === "pix" ? 0.95 : 1)) / 100;
function updateCheckout() {
  document.querySelector("#quantity").textContent = quantity;
  document.querySelector("#checkout-total").textContent = money(total());
  document.querySelector("#checkout-status").textContent = "";
  document.querySelector("#minus").disabled = quantity === 1;
  document.querySelector("#plus").disabled = quantity === 10;
}
document.querySelector("#minus").addEventListener("click", () => {
  quantity = Math.max(1, quantity - 1);
  updateCheckout();
});
document.querySelector("#plus").addEventListener("click", () => {
  quantity = Math.min(10, quantity + 1);
  updateCheckout();
});
document
  .querySelectorAll('input[name="payment"]')
  .forEach((input) => input.addEventListener("change", updateCheckout));
document.querySelector("#checkout").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#checkout-status").textContent =
    `Simulação concluída: ${quantity} ${quantity === 1 ? "unidade" : "unidades"}, ${money(total())} via ${payment() === "pix" ? "PIX" : "cartão"}. Nenhuma cobrança realizada.`;
});
updateCheckout();

document
  .querySelector("#contact-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button");
    const status = document.querySelector("#form-status");
    button.disabled = true;
    status.textContent = "Enviando mensagem…";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw Error("send failed");
      status.textContent = "Mensagem enviada. Obrigado pelo contato!";
      form.reset();
    } catch {
      status.textContent =
        "Não foi possível enviar agora. Você pode escrever para gufidelis116@gmail.com.";
    } finally {
      button.disabled = false;
    }
  });

/* Motion is progressive enhancement: the HTML is complete without JavaScript. */
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const motionButton = document.querySelector("#motion-toggle");
let manualPause = false;
const isMotionPaused = () => manualPause || reducedMotion.matches;
function syncMotion() {
  const paused = isMotionPaused();
  document.body.classList.toggle("motion-paused", paused);
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute(
    "aria-label",
    reducedMotion.matches
      ? "Movimento reduzido ativado no dispositivo"
      : paused
        ? "Ativar animações"
        : "Pausar animações",
  );
  motionButton.textContent = paused ? "▷" : "Ⅱ";
  document.dispatchEvent(new Event("portfolio:motion"));
  scheduleScroll();
}
motionButton.addEventListener("click", () => {
  if (reducedMotion.matches) {
    // Preserve the system preference; the control accurately describes this state.
    motionButton.setAttribute(
      "aria-label",
      "Movimento reduzido ativado no seu dispositivo",
    );
    return;
  }
  manualPause = !manualPause;
  syncMotion();
});
reducedMotion.addEventListener("change", syncMotion);
document.body.classList.add("hero-ready");
document.querySelectorAll(".project-disclosure").forEach((article) => {
  article.querySelector(".project-panel").inert =
    !article.classList.contains("is-expanded");
});
document.body.classList.add("disclosures-ready", "scroll-enhanced");

const revealElements = document.querySelectorAll(
  ".section-top,.feature-project,.method-heading,.method-route,.method-detail,.engineering-heading,.engineering-columns article,.about-photo,.about-text,.trajectory-header,.timeline article,.cert-heading,.certificate",
);
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -20px 0px" },
  );
  revealElements.forEach((element, index) => {
    element.classList.add("reveal");
    if (element.matches(".certificate,.engineering-columns article,.method-stop"))
      element.style.setProperty("--reveal-delay", (index % 3) * 95 + "ms");
    observer.observe(element);
  });
}
const heroCopy = document.querySelector(".hero-content");
const hero = document.querySelector(".hero");
const projectImages = [...document.querySelectorAll(".project-surface > img")];
const system = document.querySelector(".system-visual");
const orbits = [...document.querySelectorAll(".system-orbit")];
const statementLines = [...document.querySelectorAll(".statement-line")];
const pageProgress = document.querySelector(".page-progress span");
const methodRoute = document.querySelector(".method-route");
const methodStops = [...document.querySelectorAll("[data-method-step]")];
const methodDetail = document.querySelector("#method-detail");
const methodSteps = [
  ["01 / O CONTEXTO", "Começo entendendo para quem a experiência existe e qual problema precisa desaparecer — antes de escolher a ferramenta."],
  ["02 / A CONSTRUÇÃO", "Desenho um caminho que une interface e lógica. Cada tecnologia entra com propósito, e cada estado da experiência tem uma razão para existir."],
  ["03 / O REFINO", "Reviso os detalhes que fazem diferença no uso real: acessibilidade, desempenho, respostas a erros e a sensação de que tudo simplesmente funciona."],
];
const clamp = (value) => Math.max(0, Math.min(1, value));
let systemVisible = false;
const refreshSystemActivity = () =>
  system.classList.toggle(
    "system-active",
    systemVisible && !document.hidden && !isMotionPaused(),
  );
const systemObserver = new IntersectionObserver(([entry]) => {
  systemVisible = entry.isIntersecting;
  refreshSystemActivity();
});
systemObserver.observe(system);
document.addEventListener("visibilitychange", refreshSystemActivity);
document.addEventListener("portfolio:motion", refreshSystemActivity);
system.addEventListener("pointermove", (event) => {
  if (isMotionPaused() || event.pointerType !== "mouse") return;
  const rect = system.getBoundingClientRect();
  system.style.setProperty(
    "--core-x",
    (-(event.clientY - rect.top - rect.height / 2) / rect.height) * 14 + "deg",
  );
  system.style.setProperty(
    "--core-y",
    ((event.clientX - rect.left - rect.width / 2) / rect.width) * 18 + "deg",
  );
});
system.addEventListener("pointerleave", () => {
  system.style.setProperty("--core-x", "0deg");
  system.style.setProperty("--core-y", "0deg");
});
let scrollFrame = 0;
function selectMethodStep(index) {
  const [label, copy] = methodSteps[index];
  methodStops.forEach((button, i) => {
    const active = i === index;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  methodRoute.style.setProperty("--route-progress", String(index / 2));
  methodDetail.classList.remove("detail-changed");
  requestAnimationFrame(() => {
    methodDetail.querySelector(".method-detail-index").textContent = label;
    methodDetail.querySelector("p").textContent = copy;
    methodDetail.classList.add("detail-changed");
  });
}
methodStops.forEach((button) =>
  button.addEventListener("click", () =>
    selectMethodStep(Number(button.dataset.methodStep)),
  ),
);
const methodObserver = new IntersectionObserver(([entry]) => {
  methodRoute.classList.toggle("route-in-view", entry.isIntersecting);
});
methodObserver.observe(methodRoute);
const projectSurfaces = [...document.querySelectorAll(".project-surface")];
projectSurfaces.forEach((surface) => {
  surface.addEventListener("pointermove", (event) => {
    if (isMotionPaused() || event.pointerType !== "mouse") return;
    const rect = surface.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    surface.style.setProperty(
      "--surface-tilt-x",
      (-y * 3.8).toFixed(2) + "deg",
    );
    surface.style.setProperty(
      "--surface-tilt-y",
      (x * 4.8).toFixed(2) + "deg",
    );
    surface.style.setProperty(
      "--surface-glow-x",
      ((x + 0.5) * 100).toFixed(1) + "%",
    );
    surface.style.setProperty(
      "--surface-glow-y",
      ((y + 0.5) * 100).toFixed(1) + "%",
    );
  });
  surface.addEventListener("pointerleave", () => {
    surface.style.setProperty("--surface-tilt-x", "0deg");
    surface.style.setProperty("--surface-tilt-y", "0deg");
  });
});

// A timeline gains a quiet progress rail as its milestones enter the viewport.
const timeline = document.querySelector(".timeline");
const timelineRail = document.createElement("span");
timelineRail.className = "timeline-rail";
timelineRail.setAttribute("aria-hidden", "true");
timeline.prepend(timelineRail);
const timelineItems = [...timeline.querySelectorAll("article")];

// Certificate artwork is a preview, while the existing click still opens its full image.
document.querySelectorAll(".certificate").forEach((card) => {
  const certificate = certificates[Number(card.dataset.certificate)];
  if (!certificate) return;
  const preview = document.createElement("img");
  preview.className = "certificate-peek";
  preview.src = `assets/${certificate.image}`;
  preview.alt = "";
  preview.setAttribute("aria-hidden", "true");
  preview.loading = "lazy";
  card.insertBefore(preview, card.querySelector(".cert-arrow"));
});

// Laís's suggested questions follow the content the visitor is currently exploring.
const questionButtons = [...document.querySelectorAll(".lais-questions [data-lais-question]")];
const questionSets = {
  geral: [["Projetos em destaque", "Quais projetos mostram melhor as habilidades do Gustavo?"], ["Formação e experiência", "Qual é a formação e a experiência profissional do Gustavo?"], ["Vamos conversar?", "Como entro em contato com o Gustavo?"]],
  projetos: [["Stack técnica", "Quais tecnologias o Gustavo usa nos projetos?"], ["Desafio maior", "Qual foi um desafio técnico marcante nos projetos?"], ["Projeto favorito", "Pode me contar sobre os projetos do Gustavo?"]],
  metodo: [["Decisões técnicas", "Como o Gustavo decide quais tecnologias usar?"], ["Acessibilidade", "Como o Gustavo cuida dos detalhes e da acessibilidade?"], ["IA no fluxo", "Como a inteligência artificial participa do trabalho do Gustavo?"]],
  processo: [["Stack e dados", "Quais tecnologias e bancos de dados aparecem nos projetos?"], ["Qualidade", "Como o Gustavo pensa em desempenho e acessibilidade?"], ["Uso de IA", "Como o Gustavo usa inteligência artificial no desenvolvimento?"]],
  sobre: [["Sobre Gustavo", "Pode me contar sobre o Gustavo?"], ["Experiência prática", "Que experiências práticas o Gustavo já teve?"], ["Currículo", "Onde posso ver o currículo do Gustavo?"]],
  trajetoria: [["Formação", "Qual é a formação acadêmica do Gustavo?"], ["Experiência", "Qual é a experiência profissional do Gustavo?"], ["Certificados", "Quais certificados o Gustavo possui?"]],
};
let activeQuestionSet = "geral";
function setQuestionSet(key) {
  if (!questionSets[key] || key === activeQuestionSet) return;
  activeQuestionSet = key;
  questionButtons.forEach((button, index) => {
    const [label, question] = questionSets[key][index];
    button.textContent = label;
    button.dataset.laisQuestion = question;
  });
}
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (active) setQuestionSet(active.target.dataset.questionContext);
  }, { threshold: [0.15, 0.35, 0.6] });
  [["#projetos", "projetos"], ["#metodo", "metodo"], ["#processo", "processo"], ["#sobre", "sobre"], ["#trajetoria", "trajetoria"]].forEach(([selector, key]) => {
    const section = document.querySelector(selector);
    section.dataset.questionContext = key;
    sectionObserver.observe(section);
  });
}

// The pointer accent supplements, but never replaces, the native cursor.
const cursorSignal = document.createElement("span");
cursorSignal.className = "cursor-signal";
cursorSignal.setAttribute("aria-hidden", "true");
document.body.append(cursorSignal);
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
if (finePointer.matches) {
  let cursorX = innerWidth / 2;
  let cursorY = innerHeight / 2;
  let cursorFrame = 0;
  addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    if (cursorFrame) return;
    cursorFrame = requestAnimationFrame(() => {
      cursorSignal.style.setProperty("--cursor-x", `${cursorX}px`);
      cursorSignal.style.setProperty("--cursor-y", `${cursorY}px`);
      cursorSignal.classList.add("cursor-visible");
      cursorFrame = 0;
    });
  }, { passive: true });
  document.addEventListener("pointerover", (event) => {
    if (event.target.closest("a,button,[role=button],input[type=range]")) cursorSignal.classList.add("cursor-over-control");
  });
  document.addEventListener("pointerout", (event) => {
    if (event.target.closest("a,button,[role=button],input[type=range]")) cursorSignal.classList.remove("cursor-over-control");
  });
  document.addEventListener("pointerleave", () => cursorSignal.classList.remove("cursor-visible"));
}

// Contact receives one restrained arrival cue; the decoration is static outside the viewport.
const contactSection = document.querySelector("#contato");
if ("IntersectionObserver" in window) {
  const contactObserver = new IntersectionObserver(([entry]) => {
    contactSection.classList.toggle("contact-in-view", entry.isIntersecting);
  }, { threshold: 0.2 });
  contactObserver.observe(contactSection);
}

function updateScroll() {
  scrollFrame = 0;
  const paused = isMotionPaused();
  for (const line of statementLines) {
    const rect = line.getBoundingClientRect();
    const progress = paused
      ? 1
      : clamp((innerHeight * 0.9 - rect.top) / (innerHeight * 0.33));
    const eased = 1 - Math.pow(1 - progress, 3);
    line.style.setProperty("--line-opacity", String(eased));
    line.style.setProperty("--line-y", (1 - eased) * 65 + "px");
    line.style.setProperty("--line-rotation", (1 - eased) * 12 + "deg");
    line.style.setProperty("--line-blur", (1 - eased) * 7 + "px");
  }
  const heroProgress = Math.min(scrollY / hero.offsetHeight, 1);
  const pageLength = document.documentElement.scrollHeight - innerHeight || 1;
  pageProgress.style.transform =
    "scaleX(" + clamp(scrollY / pageLength) + ")";
  const timelineRect = timeline.getBoundingClientRect();
  const timelineProgress = paused ? 1 : clamp((innerHeight * 0.82 - timelineRect.top) / (timelineRect.height + innerHeight * 0.12));
  timeline.style.setProperty("--timeline-progress", String(timelineProgress));
  let activeMilestone = -1;
  timelineItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    if (rect.top <= innerHeight * 0.56 && rect.bottom >= innerHeight * 0.28) activeMilestone = index;
  });
  timelineItems.forEach((item, index) => item.classList.toggle("timeline-active", index === activeMilestone));
  heroCopy.style.transform = paused
    ? ""
    : "translate3d(0," + heroProgress * 100 + "px,0)";
  heroCopy.style.opacity = paused
    ? "1"
    : String(Math.max(0, 1 - heroProgress * 1.35));
  for (const img of projectImages) {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    img.style.translate = paused
      ? ""
      : "0 " +
        ((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * 16 +
        "px";
  }
  const r = system.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) {
    const entrance = paused
      ? 1
      : clamp((innerHeight * 0.95 - r.top) / (innerHeight * 0.42));
    system.style.setProperty("--system-opacity", String(entrance));
    system.style.setProperty("--system-scale", String(0.84 + entrance * 0.16));
    system.style.setProperty("--system-blur", (1 - entrance) * 5 + "px");
    const progress = (innerHeight - r.top) / (innerHeight + r.height);
    orbits.forEach((orbit, i) => {
      const rotation =
        (i ? 25 : -18) + (paused ? 0 : progress * (i ? -40 : 40));
      orbit.style.transform =
        "translate(-50%,-50%) rotate(" + rotation + "deg)";
    });
  }
  const routeTop = methodRoute.getBoundingClientRect().top;
  const routeProgress = paused
    ? 1
    : clamp((innerHeight * 0.82 - routeTop) / (innerHeight * 0.55));
  methodRoute.style.setProperty("--scroll-ink", String(routeProgress));
}
function scheduleScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}
addEventListener("scroll", scheduleScroll, { passive: true });
addEventListener("resize", scheduleScroll, { passive: true });
syncMotion();

document.querySelectorAll('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    target.scrollIntoView({
      behavior: isMotionPaused() ? "instant" : "smooth",
      block: "start",
    });
  }),
);
