import { createSessionController } from "./lais-session.js";
import { mountLaisVisual } from "./lais-visual.js";
const panel = document.querySelector("#lais-dialog");
mountLaisVisual(panel);
const launcher = document.querySelector("#lais-launcher");
const status = document.querySelector("#lais-status");
const transcript = document.querySelector("#lais-transcript");
const consent = document.querySelector("#lais-consent");
const startButton = document.querySelector("#lais-start");
const stopButton = document.querySelector("#lais-stop");
const muteButton = document.querySelector("#lais-mute");
const form = document.querySelector("#lais-form");
const input = document.querySelector("#lais-input");
const submit = form.querySelector("button");
const notice = document.querySelector("#lais-notice");
const modeButtons = [...document.querySelectorAll("[data-lais-mode]")];
let mode = "voice",
  config = null,
  muted = false,
  previousFocus;
const errors = {
  connection:
    "Não consegui conectar à Laís. Os créditos podem ter acabado ou o serviço pode estar indisponível. Tente novamente mais tarde ou use o contato do Gustavo.",
  microphone:
    "O microfone não foi liberado. Você pode permitir o acesso no navegador ou escolher a conversa por texto.",
  duration:
    "A sessão de três minutos foi encerrada. Obrigada pela conversa! Para continuar, fale diretamente com o Gustavo.",
};
const controller = createSessionController({
  connect: async (options, stillWanted) => {
    const { Conversation } = await import("@elevenlabs/client");
    if (!stillWanted()) throw Error("cancelled");
    if (config?.privateTest || config?.securedSessions) {
      if (config.privateTest && !["localhost", "127.0.0.1"].includes(location.hostname))
        throw Error("Private tests require localhost");
      const response = await fetch("/api/lais-session?mode=" + (options.textOnly ? "text" : "voice"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error("Private session unavailable");
      const credentials = await response.json();
      if (!stillWanted()) throw Error("cancelled");
      delete options.agentId;
      if (options.textOnly) options.signedUrl = credentials.signedUrl;
      else options.conversationToken = credentials.conversationToken;
    }
    return Conversation.startSession(options);
  },
  onState: updateState,
  onError: (code) => {
    notice.textContent = errors[code] || errors.connection;
  },
  onMessage: renderMessage,
});
function renderMessage({ message, role, source, event_id }) {
    if (!message) return;
    const speaker = role === "user" || source === "user" ? "Você" : "Laís";
    const key = event_id === undefined ? null : speaker + "-" + event_id;
    const existing = key
      ? [...transcript.children].find((x) => x.dataset.eventId === key)
      : null;
    if (existing) {
      existing.querySelector("p").textContent = message;
      return;
    }
    const row = document.createElement("div");
    row.className = "lais-message" + (speaker === "Você" ? " from-user" : "");
    if (key) row.dataset.eventId = key;
    const label = document.createElement("strong");
    label.textContent = speaker;
    const body = document.createElement("p");
    body.textContent = message;
    row.append(label, body);
    transcript.append(row);
    while (transcript.children.length > 50)
      transcript.firstElementChild.remove();
    transcript.scrollTop = transcript.scrollHeight;
}
function updateState(state) {
  panel.dataset.state = state;
  const busy = state !== "idle";
  status.textContent =
    {
      idle: config?.enabled ? "Pronta para conversar" : "Em configuração",
      connecting: "Conectando…",
      listening: muted ? "Microfone pausado" : "Ouvindo você",
      speaking: "Laís está falando",
      text: "Conversa por texto",
    }[state] || state;
  startButton.hidden = busy;
  stopButton.hidden = !busy;
  muteButton.hidden = !busy || mode === "text" || state === "connecting";
  modeButtons.forEach((b) => (b.disabled = busy));
  consent.disabled = busy;
  startButton.disabled = !config?.enabled || !consent.checked;
  input.disabled = !busy || state === "connecting";
  submit.disabled = input.disabled;
  if (!busy) {
    muted = false;
    muteButton.setAttribute("aria-pressed", "false");
    muteButton.textContent = "Pausar microfone";
  }
}
launcher.addEventListener("click", async () => {
  previousFocus = document.activeElement;
  panel.showModal();
  launcher.setAttribute("aria-expanded", "true");
  if (config === null) {
    try {
      const response = await fetch("lais-config.json", { cache: "no-store" });
      if (!response.ok) throw Error();
      config = await response.json();
      if (!/^agent_[a-zA-Z0-9]+$|^[a-zA-Z0-9]{15,}$/.test(config.agentId || ""))
        config.enabled = false;
    } catch {
      config = { enabled: false };
    }
    notice.textContent = config.enabled
      ? (config.privateTest ? "Teste privado, não comercial · Voz por elevenlabs.io · Até 3 minutos por conversa." : "")
      : "A Laís ainda não está conectada à ElevenLabs. A conversa será liberada após a configuração da conta e da voz. Nenhuma mensagem ou áudio é enviado neste estado.";
  }
  updateState("idle");
});
async function closePanel() {
  await controller.stop();
  panel.close();
}
panel.querySelector(".lais-close").addEventListener("click", closePanel);
panel.addEventListener("cancel", (event) => {
  event.preventDefault();
  void closePanel();
});
panel.addEventListener("close", () => {
  void controller.stop();
  transcript.replaceChildren();
  input.value = "";
  consent.checked = false;
  launcher.setAttribute("aria-expanded", "false");
  previousFocus?.focus({ preventScroll: true });
});
modeButtons.forEach((button) =>
  button.addEventListener("click", () => {
    mode = button.dataset.laisMode;
    modeButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b === button)),
    );
    startButton.textContent =
      mode === "voice"
        ? "Iniciar conversa ao vivo"
        : "Iniciar conversa por texto";
    document.querySelector("#lais-mode-help").textContent =
      mode === "voice"
        ? "Pode falar naturalmente e interromper quando precisar."
        : "Converse sem abrir o microfone.";
    updateState("idle");
  }),
);
consent.addEventListener("change", () => updateState("idle"));
startButton.addEventListener("click", async () => {
  if (!config?.enabled || !consent.checked) return;
  notice.textContent = "";
  transcript.replaceChildren();
  await controller.start({
    agentId: config.agentId,
    textOnly: mode === "text",
  });
  if (controller.active() && mode === "text") input.focus();
});
stopButton.addEventListener("click", () => controller.stop());
muteButton.addEventListener("click", () => {
  muted = !muted;
  controller.mute(muted);
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButton.textContent = muted ? "Ativar microfone" : "Pausar microfone";
  status.textContent = muted ? "Microfone pausado" : "Ouvindo você";
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !controller.active()) return;
  controller.send(text.slice(0, 1000));
  renderMessage({ message: text.slice(0, 1000), role: "user" });
  input.value = "";
});
document.querySelectorAll("[data-lais-question]").forEach((button) =>
  button.addEventListener("click", () => {
    const text = button.dataset.laisQuestion;
    if (controller.active()) {
      controller.send(text);
      renderMessage({ message: text, role: "user" });
    } else {
      notice.textContent = config?.enabled
        ? "Inicie uma conversa para perguntar: " + text
        : "A Laís está em configuração. Você já pode explorar essa informação nas seções do portfólio.";
    }
  }),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && controller.active()) {
    void controller.stop();
    notice.textContent =
      "Conversa encerrada ao sair desta aba, para proteger o microfone e os créditos.";
  }
});
addEventListener("pagehide", () => {
  void controller.stop();
});
