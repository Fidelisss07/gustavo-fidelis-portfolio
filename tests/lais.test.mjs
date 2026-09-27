import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSessionController } from "../src/lais-session.js";
function harness(connect) {
  const states = [],
    errors = [],
    messages = [];
  const controller = createSessionController({
    connect,
    onState: (s) => states.push(s),
    onError: (e) => errors.push(e),
    onMessage: (m) => messages.push(m),
  });
  return { controller, states, errors, messages };
}
test("voice uses WebRTC and stops the session", async () => {
  let opts,
    ended = 0;
  const h = harness(async (options) => {
    opts = options;
    return {
      endSession: async () => {
        ended++;
      },
    };
  });
  assert.equal(await h.controller.start({ agentId: "test" }), true);
  assert.equal(opts.connectionType, "webrtc");
  assert.equal(opts.textOnly, false);
  await h.controller.stop();
  assert.equal(ended, 1);
  assert.equal(h.controller.active(), false);
});
test("text never starts a voice-mode session", async () => {
  let opts;
  const h = harness(async (options) => {
    opts = options;
    return { endSession: async () => {} };
  });
  await h.controller.start({ agentId: "test", textOnly: true });
  assert.equal(opts.textOnly, true);
  assert.equal(opts.connectionType, "websocket");
  assert.equal(h.states.at(-1), "text");
  await h.controller.stop();
});
test("closing during connection disposes a late session", async () => {
  let resolve,
    ended = 0;
  const h = harness(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const pending = h.controller.start({ agentId: "test" });
  await h.controller.stop();
  resolve({
    endSession: async () => {
      ended++;
    },
  });
  assert.equal(await pending, false);
  assert.equal(ended, 1);
  assert.equal(h.controller.active(), false);
});
test("a second start is ignored while connecting", async () => {
  let resolve,
    calls = 0;
  const h = harness(() => {
    calls++;
    return new Promise((r) => {
      resolve = r;
    });
  });
  const first = h.controller.start({ agentId: "test" });
  assert.equal(await h.controller.start({ agentId: "test" }), false);
  resolve({ endSession: async () => {} });
  await first;
  await h.controller.stop();
  assert.equal(calls, 1);
});
test("microphone denial produces an actionable state", async () => {
  const h = harness(async () => {
    const e = Error();
    e.name = "NotAllowedError";
    throw e;
  });
  assert.equal(await h.controller.start({ agentId: "test" }), false);
  assert.deepEqual(h.errors, ["microphone"]);
  assert.equal(h.controller.active(), false);
});
test("old session messages cannot enter a new transcript", async () => {
  let opts;
  const h = harness(async (o) => {
    opts = o;
    return { endSession: async () => {} };
  });
  await h.controller.start({ agentId: "test" });
  await h.controller.stop();
  opts.onMessage({ message: "stale" });
  assert.equal(h.messages.length, 0);
});
test("remote errors terminate active sessions", async () => {
  let opts,
    ended = 0;
  const h = harness(async (o) => {
    opts = o;
    return {
      endSession: async () => {
        ended++;
      },
    };
  });
  await h.controller.start({ agentId: "test" });
  opts.onError("secret provider details");
  assert.equal(h.controller.active(), false);
  assert.equal(ended, 1);
  assert.deepEqual(h.errors, ["connection"]);
});
test("agent model and limits match the agreed scope", () => {
  const s = JSON.parse(readFileSync("lais/agent-settings.json", "utf8"));
  assert.equal(s.conversation_config.agent.prompt.llm, "gemini-2.5-flash");
  assert.equal(
    s.conversation_config.agent.prompt.backup_llm_config.preference,
    "disabled",
  );
  assert.equal(s.platform_settings.analysis_llm, "gemini-2.5-flash");
  assert.equal(s.platform_settings.call_limits.bursting_enabled, false);
  assert.equal(s.platform_settings.call_limits.daily_limit, 5);
  assert.equal(s.conversation_config.conversation.max_duration_seconds, 180);
  assert.equal(s.platform_settings.auth.require_origin_header, true);
  assert.equal(s.platform_settings.privacy.record_voice, false);
  assert.equal(s.platform_settings.privacy.retention_days, 0);
});
test("all six inline previews have independent accessible controls", () => {
  const html = readFileSync("dist/index.html", "utf8");
  assert.equal((html.match(/class="project-toggle"/g) || []).length, 6);
  assert.equal((html.match(/class="project-panel"/g) || []).length, 6);
  assert.equal((html.match(/project-disclosure is-expanded/g) || []).length, 2);
  for (const id of ["debugarena", "amx", "balu", "acf", "milecar", "tcar"])
    assert.ok(html.includes('aria-controls="preview-' + id + '"'));
});
test("public client configuration never contains a secret", () => {
  const c = JSON.parse(readFileSync("dist/lais-config.json", "utf8"));
  assert.deepEqual(Object.keys(c).sort(), [
    "agentId",
    "enabled",
    "maxDurationSeconds",
  ]);
  assert.equal(c.maxDurationSeconds, 180);
});
