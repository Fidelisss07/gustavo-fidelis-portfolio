import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const applying = process.argv.includes("--apply");
const settings = JSON.parse(readFileSync("lais/agent-settings.json", "utf8"));
settings.conversation_config.agent.prompt.prompt = readFileSync(
  "lais/system-prompt.md",
  "utf8",
);
const names = ["portfolio", "curriculo", "github", "linkedin", "complementar"];
const docs = names
  .filter((name) => existsSync("lais/knowledge/" + name + ".md"))
  .map((name) => ({
    name: "Laís / " + name,
    key: name,
    text: readFileSync("lais/knowledge/" + name + ".md", "utf8"),
  }));
if (
  !docs.some((d) => d.key === "portfolio") ||
  !docs.some((d) => d.key === "curriculo")
)
  throw Error("Execute npm run lais:knowledge antes de configurar.");
if (docs.reduce((n, d) => n + d.text.length, 0) > 65000)
  throw Error(
    "A base ultrapassa 65 mil caracteres. Revise e configure RAG antes de continuar para controlar custo e latência.",
  );
console.log(
  "Plano: Gemini 2.5 Flash; voz ElevenLabs; 1 conversa simultânea; 5/dia; até 180 segundos. Documentos: " +
    docs.map((d) => d.key).join(", ") +
    ". Sem compras ou alterações de faturamento.",
);
if (!applying) {
  console.log(
    "Prévia apenas. Para aplicar com segurança, execute Configure-Lais.ps1.",
  );
  process.exit(0);
}
if (
  ![
    "--credits-only",
    "--public-knowledge-reviewed",
    "--license-reviewed",
  ].every((flag) => process.argv.includes(flag))
)
  throw Error(
    "Confirme revisão da base pública, licença da voz e uso limitado a créditos pelo Configure-Lais.ps1.",
  );
let input = {};
if (process.argv.includes("--stdin")) {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  input = JSON.parse(raw);
  raw = "";
}
const key = input.apiKey || process.env.ELEVENLABS_API_KEY;
const voiceId = input.voiceId || process.env.ELEVENLABS_VOICE_ID;
if (!key || !voiceId || !/^[A-Za-z0-9_-]{10,100}$/.test(voiceId))
  throw Error(
    "Chave e ID da voz são necessários; não os coloque no código ou no chat.",
  );
input = {};
const stateFile = ".lais-state.json";
let state = existsSync(stateFile)
  ? JSON.parse(readFileSync(stateFile, "utf8"))
  : { documents: {} };
const saveState = () =>
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
if (state.pending)
  throw Error(
    "Uma criação anterior ficou sem confirmação. Confira o painel ElevenLabs e reconcilie .lais-state.json antes de repetir; nenhuma duplicata foi criada.",
  );
async function api(path, method = "GET", body) {
  const r = await fetch("https://api.elevenlabs.io/v1" + path, {
    method,
    headers: {
      "xi-api-key": key,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok)
    throw Error(
      "ElevenLabs retornou HTTP " +
        r.status +
        " em " +
        path.split("?")[0] +
        ". Nenhuma chave foi registrada.",
    );
  return r.json();
}
const subscription = await api("/user/subscription");
if (subscription.max_credit_limit_extension !== 0)
  throw Error(
    "Não foi confirmado um bloqueio de cobrança excedente. Defina o limite de usage-based billing como zero no painel ElevenLabs e execute novamente. O script não altera faturamento.",
  );
const voice = await api("/voices/" + encodeURIComponent(voiceId));
if (voice.voice_id !== voiceId)
  throw Error("A voz selecionada não pôde ser confirmada.");
settings.conversation_config.tts.voice_id = voiceId;
if (state.agentId) {
  const existing = await api(
    "/convai/agents/" + encodeURIComponent(state.agentId),
  );
  if (existing.name !== settings.name)
    throw Error(
      "O agente salvo não corresponde à Laís deste projeto. Revise antes de atualizar.",
    );
}
for (const doc of docs) {
  const hash = createHash("sha256").update(doc.text).digest("hex");
  const saved = state.documents[doc.key];
  if (saved?.hash === hash) continue;
  if (saved?.id) {
    await api(
      "/convai/knowledge-base/" + encodeURIComponent(saved.id),
      "PATCH",
      { name: doc.name, content: doc.text },
    );
    state.documents[doc.key] = { ...saved, hash };
    saveState();
  } else {
    state.pending = { type: "document", name: doc.name };
    saveState();
    const added = await api("/convai/knowledge-base/text", "POST", {
      name: doc.name,
      text: doc.text,
    });
    if (!added.id)
      throw Error(
        "Documento sem ID na resposta; confira o painel antes de repetir.",
      );
    state.documents[doc.key] = { id: added.id, hash };
    delete state.pending;
    saveState();
  }
}
settings.conversation_config.agent.prompt.knowledge_base = docs.map((doc) => ({
  type: "text",
  id: state.documents[doc.key].id,
  name: doc.name,
  usage_mode: "prompt",
}));
if (state.agentId)
  await api(
    "/convai/agents/" + encodeURIComponent(state.agentId),
    "PATCH",
    settings,
  );
else {
  state.pending = { type: "agent", name: settings.name };
  saveState();
  const created = await api("/convai/agents/create", "POST", {
    ...settings,
    tags: ["portfolio-gf-lais"],
  });
  if (!created.agent_id)
    throw Error(
      "Agente sem ID na resposta; confira o painel antes de repetir.",
    );
  state.agentId = created.agent_id;
  delete state.pending;
  saveState();
}
const verified = await api(
  "/convai/agents/" + encodeURIComponent(state.agentId),
);
const limits = verified.platform_settings?.call_limits;
const prompt = verified.conversation_config?.agent?.prompt;
const auth = verified.platform_settings?.auth;
if (
  prompt?.llm !== "gemini-2.5-flash" ||
  prompt.backup_llm_config?.preference !== "disabled" ||
  limits?.bursting_enabled !== false ||
  limits?.daily_limit !== 5 ||
  limits?.agent_concurrency_limit !== 1 ||
  verified.conversation_config?.conversation?.max_duration_seconds !== 180 ||
  !auth?.require_origin_header ||
  !auth.allowlist?.length
)
  throw Error(
    "O servidor não confirmou todos os limites e restrições. O botão continua desativado; confira a configuração.",
  );
writeFileSync(
  "dist/lais-config.json",
  JSON.stringify(
    { enabled: true, agentId: state.agentId, maxDurationSeconds: 180 },
    null,
    2,
  ) + "\n",
);
console.log(
  "Laís configurada e verificada na ElevenLabs. A chave não foi salva. Nenhuma conversa de teste foi iniciada e nenhum plano foi contratado. Publique a nova configuração do site para ativar o botão.",
);
