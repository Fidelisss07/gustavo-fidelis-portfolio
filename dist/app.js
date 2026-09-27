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
const labels = [
  "FREELANCE / COMMERCE",
  "PRODUTO / COMMERCE",
  "EDTECH / OPEN SOURCE",
  "AUTOMOTIVO / REDESIGN",
  "AUTOMOTIVO / REDESIGN",
  "AUTOMOTIVO / REDESIGN",
];
const tones = ["balu", "amx", "debug", "acf", "mile", "tcar"];
const subtitles = [
  "Da impressão 3D à primeira compra.",
  "Precisão em cada etapa da compra.",
  "Aprender a programar. Investigando bugs.",
  "Performance também na experiência.",
  "Um novo olhar sobre o mercado automotivo.",
  "Uma nova interface. O mesmo contrato de API.",
];
document.querySelector("#project-grid").innerHTML = projects
  .map(
    (p, i) => `<article class="project-card" id="projeto-${p.id}">
 <button class="project-visual visual-${tones[i]}" data-project="${p.id}" aria-label="Explorar estudo de caso de ${escapeHTML(p.name)}"><span class="visual-number">${String(i + 1).padStart(2, "0")} / ${labels[i]}</span><span class="project-word" aria-hidden="true">${["MAKE.", "TIME.", "SOLVE.", "DRIVE.", "MOVE.", "SHIFT."][i]}</span><img src="assets/${p.image}" alt="" width="320" height="240" loading="lazy"><span class="visual-action" aria-hidden="true">Explorar projeto <b>↗</b></span></button>
 <div class="project-meta"><h3>${escapeHTML(p.name)}</h3><span>${p.tags.slice(0, 2).map(escapeHTML).join(" / ")}</span></div><p>${subtitles[i]}</p><div class="project-actions"><button class="text-link" data-project="${p.id}">Decisões & detalhes <span aria-hidden="true">↗</span></button><a href="${p.url}" target="_blank" rel="noopener">${i < 2 ? "Visitar site" : "Ver prévia"} ↗</a></div>
</article>`,
  )
  .join("");
document.querySelector("#certificates").innerHTML = certificates
  .map(
    (c, i) =>
      `<a class="certificate" href="assets/${c.image}" data-certificate="${i}" aria-label="Abrir certificado: ${escapeHTML(c.name)}"><span class="cert-number">${String(i + 1).padStart(2, "0")}</span><span><strong>${escapeHTML(c.name)}</strong><small>${i === 0 ? "FIAP · 80 horas · 2026" : `Dev Club · ${escapeHTML(c.meta)}`}</small></span><span class="cert-arrow" aria-hidden="true">↗</span></a>`,
  )
  .join("");

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
    `<p class="eyebrow">ESTUDO DE CASO / ${escapeHTML(p.tags[0])}</p><h2 id="dialog-title">${escapeHTML(p.name)}</h2><p class="dialog-intro">${escapeHTML(p.description)}</p><div class="stack">${p.tags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}</div><div class="case-blocks">${p.blocks.map((b) => `<section><h3>${escapeHTML(b.title)}</h3><p>${escapeHTML(b.text)}</p></section>`).join("")}</div><p class="case-status"><strong>Situação registrada no portfólio original</strong>${escapeHTML(p.status)}</p><div class="dialog-links"><a class="solid-button" href="${p.url}" target="_blank" rel="noopener">Abrir projeto ↗</a>${p.repo ? `<a class="text-link" href="${p.repo}" target="_blank" rel="noopener">Código no GitHub ↗</a>` : '<span class="private-repo">Repositório privado</span>'}</div>`,
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
      `<p class="eyebrow">FORMAÇÃO COMPLEMENTAR</p><h2 id="dialog-title">${escapeHTML(c.name)}</h2><p class="dialog-intro">${Number(cert.dataset.certificate) === 0 ? "FIAP" : "Dev Club"} · ${escapeHTML(c.meta)}</p><img class="certificate-image" src="assets/${c.image}" alt="Certificado de ${escapeHTML(c.name)}"><div class="dialog-links"><a class="text-link" href="assets/${c.image}" target="_blank" rel="noopener">Abrir imagem original ↗</a>${c.verify ? `<a class="text-link" href="${c.verify}" target="_blank" rel="noopener">Verificar autenticidade ↗</a>` : ""}</div>${Number(cert.dataset.certificate) === 0 ? '<p class="certificate-key">Chave FIAP: EFD06F5C033939B56E8074C87D070B1D</p>' : ""}`,
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

// Progressive enhancement: content remains visible if observers are unavailable.
if (
  "IntersectionObserver" in window &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".project-card,.section-heading,.timeline article,.about-copy,.lab",
    )
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
}
const sections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const navigation = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document.querySelectorAll(".header nav a").forEach((link) => {
            const active = link.getAttribute("href") === `#${entry.target.id}`;
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      });
    },
    { rootMargin: "-10% 0px -70% 0px" },
  );
  sections.forEach((section) => navigation.observe(section));
}
