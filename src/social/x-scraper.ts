import { spawn } from "node:child_process";
import { normalizeXScraperRun } from "./normalize-x.js";
import type { NormalizedSocialScan, XSocialSearchOptions } from "./types.js";

function commandFor(executable: string): string {
  if (process.platform === "win32" && executable === "npx") return "npx.cmd";
  return executable;
}

function argsFor(options: {
  executable: string;
  packageSpec: string;
  query: string;
  limit: number;
  latest: boolean;
}): string[] {
  const args = ["search", options.query, "--limit", String(options.limit), "--format", "json"];
  if (options.latest) args.push("--latest");

  if (options.executable === "npx") {
    return ["--yes", options.packageSpec, ...args];
  }

  return args;
}

function parseOutput(stdout: string): unknown {
  const text = stdout.trim();
  if (!text) throw new Error("x-scraper-no-api returned no JSON output.");

  try {
    return JSON.parse(text);
  } catch {
    const lines = text.split(/\r?\n/).reverse();
    for (const line of lines) {
      if (!line.trim().startsWith("{") && !line.trim().startsWith("[")) continue;
      try {
        return JSON.parse(line);
      } catch {
        continue;
      }
    }
    throw new Error("x-scraper-no-api returned invalid JSON output.");
  }
}

function isExecutableSetupError(error: NodeJS.ErrnoException): boolean {
  return error.code === "ENOENT" || error.code === "EACCES";
}

export async function runXScraperSearch(
  options: XSocialSearchOptions,
): Promise<NormalizedSocialScan> {
  if (!options.query?.trim()) throw new Error("query is required");

  const executable =
    options.executable ??
    options.env?.X_SCRAPER_BIN ??
    process.env.X_SCRAPER_BIN ??
    "npx";
  const packageSpec =
    options.packageSpec ??
    options.env?.X_SCRAPER_PACKAGE ??
    process.env.X_SCRAPER_PACKAGE ??
    "github:JoinArtisanVent/x-scraper-no-api";
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 50);
  const timeoutMs = options.timeoutMs ?? 180_000;

  const child = spawn(
    commandFor(executable),
    argsFor({
      executable,
      packageSpec,
      query: options.query.trim(),
      limit,
      latest: options.latest ?? true,
    }),
    {
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

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
      reject(new Error("x-scraper-no-api timed out after " + String(timeoutMs) + "ms."));
    }, timeoutMs);

    child.once("error", (error: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (isExecutableSetupError(error)) {
        reject(new Error("x-scraper-no-api executable is unavailable. Install xscraper or set X_SCRAPER_BIN."));
        return;
      }
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
    const reason = stderr.trim().slice(-4000) || "x-scraper-no-api exited without a diagnostic.";
    return normalizeXScraperRun(
      {
        status: "error",
        stopReason: reason,
        query: options.query.trim(),
        items: [],
      },
      new Date(),
    );
  }

  const output = parseOutput(stdout);
  return normalizeXScraperRun(
    Array.isArray(output) ? { status: "completed", query: options.query.trim(), items: output } : output,
    new Date(),
  );
}
