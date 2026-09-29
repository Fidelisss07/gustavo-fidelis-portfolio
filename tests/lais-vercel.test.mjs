import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import handler from "../api/lais-session.mjs";

const origin = "https://gustavo-fidelis-portfolio.vercel.app";
function responseStub() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}
function request(mode = "text", overrides = {}) {
  return {
    method: "POST",
    url: `/api/lais-session?mode=${mode}`,
    headers: {
      host: "gustavo-fidelis-portfolio.vercel.app",
      origin,
      "content-type": "application/json",
      ...overrides,
    },
  };
}

test("Vercel session endpoint rejects other origins before contacting ElevenLabs", async () => {
  const previousFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw Error("unexpected"); };
  try {
    const res = responseStub();
    await handler(request("voice", { origin: "https://attacker.invalid" }), res);
    assert.equal(res.statusCode, 403);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Vercel session endpoint returns only temporary session credentials", async () => {
  const oldKey = process.env.ELEVENLABS_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.ELEVENLABS_API_KEY = "test-secret-never-returned";
  let calledUrl = "";
  globalThis.fetch = async (url, options) => {
    calledUrl = String(url);
    assert.equal(options.headers["xi-api-key"], "test-secret-never-returned");
    return new Response(JSON.stringify({ signed_url: "wss://example.invalid/session" }), { status: 200 });
  };
  try {
    const res = responseStub();
    await handler(request("text"), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { signedUrl: "wss://example.invalid/session" });
    assert.ok(calledUrl.includes("get-signed-url"));
    assert.ok(!JSON.stringify(res.body).includes("test-secret-never-returned"));
    assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
  } finally {
    globalThis.fetch = previousFetch;
    if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = oldKey;
  }
});

test("Vercel session endpoint requires the secret and a valid mode", async () => {
  const oldKey = process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  try {
    const missingKey = responseStub();
    await handler(request("voice"), missingKey);
    assert.equal(missingKey.statusCode, 503);
    process.env.ELEVENLABS_API_KEY = "test-only";
    const invalidMode = responseStub();
    await handler(request("other"), invalidMode);
    assert.equal(invalidMode.statusCode, 400);
  } finally {
    if (oldKey === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = oldKey;
  }
});

test("public config and server endpoint target the same test agent", () => {
  const config = JSON.parse(readFileSync("dist/lais-config.json", "utf8"));
  const endpoint = readFileSync(new URL("../api/lais-session.mjs", import.meta.url), "utf8");
  assert.ok(config.securedSessions);
  assert.ok(endpoint.includes(`const agentId = "${config.agentId}"`));
});
