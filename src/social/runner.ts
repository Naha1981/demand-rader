import { runJevSocialSearch } from "./jev-social.js";
import { runXScraperSearch } from "./x-scraper.js";
import type { NormalizedSocialScan, SocialSearchOptions } from "./types.js";

export async function runSocialSearch(
  options: SocialSearchOptions,
): Promise<NormalizedSocialScan> {
  if (!options.query?.trim()) throw new Error("query is required");

  const source = options.source ?? (options.platform === "x" ? "x" : "jev");

  if (source === "x") {
    return runXScraperSearch({
      query: options.query,
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.latest !== undefined ? { latest: options.latest } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
      ...(options.xPackageSpec ? { packageSpec: options.xPackageSpec } : {}),
      ...(options.xExecutable ? { executable: options.xExecutable } : {}),
      ...(options.env ? { env: options.env } : {}),
    });
  }

  const platform =
    options.platform === "x" || options.platform === undefined ? "auto" : options.platform;

  return runJevSocialSearch({
    query: options.query,
    platform,
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
    ...(options.maxSteps !== undefined ? { maxSteps: options.maxSteps } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.jevPackageSpec ? { packageSpec: options.jevPackageSpec } : {}),
    ...(options.jevExecutable ? { executable: options.jevExecutable } : {}),
    ...(options.env ? { env: options.env } : {}),
  });
}
