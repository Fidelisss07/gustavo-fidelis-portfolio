import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Fallback for a missing Sites runtime: read the scoped credential only from stdin.
// No credential is written to disk, included in Git arguments, or logged.
const terminal = process.stdin.isTTY;
if (terminal) process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stderr.write("Ready for publish JSON on stdin (input is hidden).\n");
let buffer = "";
const input = await new Promise((resolve, reject) => {
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.includes("\u0003")) reject(Error("Cancelled"));
    else if (buffer.includes("\n") || buffer.includes("\r"))
      resolve(JSON.parse(buffer));
  });
  process.stdin.once("end", () => {
    if (!buffer.includes("\n")) reject(Error("Missing input"));
  });
});
if (terminal) process.stdin.setRawMode(false);
process.stdin.pause();
const credential = input.credential;
const manifest = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));
if (
  !credential?.token ||
  credential.auth_mode !== "http_extra_header" ||
  manifest.project_id !== input.project_id
)
  throw Error("Invalid source credentials or site identity");
const url = new URL(credential.remote_url);
if (url.protocol !== "https:" || url.username || url.password)
  throw Error("Invalid remote");
const env = {
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  SITES_AUTHORIZATION: `Authorization: Bearer ${credential.token}`,
};
for (const key of Object.keys(env))
  if (key.startsWith("GIT_TRACE") || key === "GIT_CURL_VERBOSE")
    delete env[key];
const redact = (s) =>
  String(s ?? "")
    .split(credential.token)
    .join("[redacted]");
function git(args, network = false, allowFailure = false) {
  const auth = network
    ? [
        "-c",
        "credential.helper=",
        "-c",
        "http.extraHeader=",
        "-c",
        "http.followRedirects=false",
        `--config-env=http.${credential.remote_url}.extraHeader=SITES_AUTHORIZATION`,
      ]
    : [];
  const r = spawnSync("git", [...auth, ...args], {
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0 && !allowFailure) throw Error(redact(r.stderr));
  return r;
}
git(["check-ref-format", `refs/heads/${credential.branch}`]);
if (!existsSync(".git")) git(["init", "--initial-branch", credential.branch]);
const advertised = git(
  [
    "ls-remote",
    "--heads",
    credential.remote_url,
    `refs/heads/${credential.branch}`,
  ],
  true,
).stdout.trim();
if (advertised) {
  const remoteHead = advertised.split(/\s/)[0];
  git(
    [
      "fetch",
      "--no-tags",
      credential.remote_url,
      `refs/heads/${credential.branch}`,
    ],
    true,
  );
  const ancestry = git(
    ["merge-base", "--is-ancestor", remoteHead, "HEAD"],
    false,
    true,
  );
  if (ancestry.status !== 0)
    throw Error(
      "Remote source advanced or diverged; reconcile before publishing.",
    );
}
git(["add", "--all"]);
git([
  "-c",
  "user.name=Gustavo Fidelis",
  "-c",
  "user.email=sites@users.noreply.openai.com",
  "commit",
  "-m",
  "Redesign portfolio with interactive WebGL sculpture and scroll choreography",
]);
const sha = git(["rev-parse", "HEAD"]).stdout.trim();
git(
  ["push", credential.remote_url, `${sha}:refs/heads/${credential.branch}`],
  true,
);
const remoteSha = git(
  [
    "ls-remote",
    "--heads",
    credential.remote_url,
    `refs/heads/${credential.branch}`,
  ],
  true,
)
  .stdout.trim()
  .split(/\s/)[0];
if (sha !== remoteSha) throw Error("Remote source verification failed");
const archive = resolve("../portfolio-astra-deploy.tar.gz");
const pack = spawnSync(
  "tar",
  ["-czf", archive, ".openai/hosting.json", "dist"],
  { encoding: "utf8", windowsHide: true },
);
if (pack.status !== 0) throw Error("Packaging failed");
const listing = spawnSync("tar", ["-tzf", archive], {
  encoding: "utf8",
  windowsHide: true,
});
if (
  listing.status !== 0 ||
  !listing.stdout.includes("dist/index.html") ||
  !listing.stdout.includes(".openai/hosting.json")
)
  throw Error("Archive validation failed");
console.log(
  JSON.stringify({ project_id: manifest.project_id, commit_sha: sha, archive }),
);
