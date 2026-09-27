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
  showDialog(
    `<p class="section-kicker">ESTUDO DE CASO / ${escapeHTML(p.tags[0])}</p><h2 id="dialog-title">${escapeHTML(p.name)}</h2><p class="dialog-intro">${escapeHTML(p.description)}</p><div class="dialog-tags">${p.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div><div class="case-blocks">${p.blocks.map((b) => `<section><h3>${escapeHTML(b.title)}</h3><p>${escapeHTML(b.text)}</p></section>`).join("")}</div><p class="case-status"><strong>Situação registrada no portfólio original</strong>${escapeHTML(p.status)}</p><div class="dialog-links"><a class="button-primary" href="${p.url}" target="_blank" rel="noopener">Abrir projeto ↗</a>${p.repo ? `<a class="inline-link" href="${p.repo}" target="_blank" rel="noopener">Código no GitHub ↗</a>` : '<span class="private-repo">Repositório privado</span>'}</div>`,
  );
}
document.addEventListener("click", (event) => {
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

const revealElements = document.querySelectorAll(
  ".statement,.section-top,.feature-project,.engineering-heading,.engineering-columns article,.about-photo,.about-text,.trajectory-header,.timeline article,.cert-heading,.certificate",
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
    if (element.matches(".certificate,.engineering-columns article"))
      element.style.setProperty("--reveal-delay", (index % 3) * 80 + "ms");
    observer.observe(element);
  });
}
const heroCopy = document.querySelector(".hero-content");
const hero = document.querySelector(".hero");
const projectImages = [...document.querySelectorAll(".project-surface > img")];
const system = document.querySelector(".system-visual");
const orbits = [...document.querySelectorAll(".system-orbit")];
let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const paused = isMotionPaused();
  const heroProgress = Math.min(scrollY / hero.offsetHeight, 1);
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
    const progress = (innerHeight - r.top) / (innerHeight + r.height);
    orbits.forEach((orbit, i) => {
      const rotation =
        (i ? 25 : -18) + (paused ? 0 : progress * (i ? -40 : 40));
      orbit.style.transform =
        "translate(-50%,-50%) rotate(" + rotation + "deg)";
    });
  }
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
