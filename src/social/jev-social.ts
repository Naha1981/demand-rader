import { spawn } from "node:child_process";
import { normalizeJevSocialRun } from "./normalize.js";
import type { JevSocialSearchOptions, JevSocialRun, NormalizedSocialScan } from "./types.js";

function commandFor(executable: string): string {
  if (process.platform === "win32" && executable === "npx") return "npx.cmd";
  return executable;
}

function argsFor(options: {
  executable: string;
  packageSpec: string;
  query: string;
  platform: "auto" | "instagram" | "tiktok" | "linkedin";
  limit: number;
  maxSteps: number;
}): string[] {
  const args = ["search", options.query, "--platform", options.platform, "--limit", String(options.limit), "--max-steps", String(options.maxSteps)];

  if (options.executable === "npx") {
    return ["--yes", options.packageSpec, ...args];
  }

  return args;
}

function parseRun(stdout: string): JevSocialRun {
  const text = stdout.trim();
  if (!text) throw new Error("Jev Social returned no JSON output.");
  try {
    return JSON.parse(text) as JevSocialRun;
  } catch {
    const lines = text.split(/\r?\n/).reverse();
    for (const line of lines) {
      if (!line.trim().startsWith("{")) continue;
      try {
        return JSON.parse(line) as JevSocialRun;
      } catch {
        continue;
      }
    }
    throw new Error("Jev Social returned invalid JSON output.");
  }
}

export async function runJevSocialSearch(options: JevSocialSearchOptions): Promise<NormalizedSocialScan> {
  if (!options.query?.trim()) throw new Error("query is required");

  const executable = options.executable ?? options.env?.JEV_SOCIAL_BIN ?? process.env.JEV_SOCIAL_BIN ?? "npx";
  const packageSpec = options.packageSpec ?? options.env?.JEV_SOCIAL_PACKAGE ?? process.env.JEV_SOCIAL_PACKAGE ?? "github:socai-io/jev-social#v0.1.8";
  const platform = options.platform ?? "auto";
  const limit = options.limit ?? 10;
  const maxSteps = options.maxSteps ?? 12;
  const timeoutMs = options.timeoutMs ?? 180_000;

  const child = spawn(commandFor(executable), argsFor({
    executable,
    packageSpec,
    query: options.query.trim(),
    platform,
    limit,
    maxSteps,
  }), {
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let stdout = "";
  let stderr = "";

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
    if (stdout.length > 4_000_000) child.kill("SIGTERM");
  });

  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
    if (stderr.length > 1_000_000) stderr = stderr.slice(-1_000_000);
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error("Jev Social timed out after " + String(timeoutMs) + "ms."));
    }, timeoutMs);

    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.once("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(code ?? 1);
    });
  });

  if (exitCode !== 0) {
    const detail = stderr.trim().slice(-4000);
    throw new Error("Jev Social exited with code " + String(exitCode) + "." + (detail ? " " + detail : ""));
  }

  const run = parseRun(stdout);
  return normalizeJevSocialRun(run);
}
