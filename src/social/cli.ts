import { evaluateRoofingSignals } from "./policy.js";
import { runJevSocialSearch } from "./jev-social.js";

function parseArgs(args: string[]) {
  const positionals: string[] = [];
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) continue;

    if (token.startsWith("--")) {
      const [key, inlineValue] = token.slice(2).split("=", 2);
      const next = args[index + 1];
      if (inlineValue !== undefined) {
        flags[key] = inlineValue;
      } else if (next && !next.startsWith("--")) {
        flags[key] = next;
        index += 1;
      } else {
        flags[key] = "true";
      }
    } else {
      positionals.push(token);
    }
  }

  return {
    query: positionals.join(" ").trim(),
    platform: flags.platform as "auto" | "instagram" | "tiktok" | "linkedin" | undefined,
    limit: flags.limit ? Number(flags.limit) : undefined,
    maxSteps: flags["max-steps"] ? Number(flags["max-steps"]) : undefined,
    timeoutMs: flags.timeout ? Number(flags.timeout) : undefined,
    geographyTerms: flags.geography ? flags.geography.split(",").map((value) => value.trim()).filter(Boolean) : ["Gauteng", "Johannesburg", "Pretoria", "Sandton"],
  };
}

const options = parseArgs(process.argv.slice(2));

if (!options.query) {
  console.error("Usage: pnpm social:scan -- <research goal> [--platform instagram|tiktok|linkedin|auto] [--geography Gauteng,Johannesburg]");
  process.exitCode = 1;
} else {
  try {
    const scan = await runJevSocialSearch(options);
    const signals = evaluateRoofingSignals(scan.evidence, {
      geographyTerms: options.geographyTerms ?? [],
      requireGeographyForCandidate: true,
    });

    console.log(JSON.stringify({
      scan,
      roofing: {
        signals,
        candidates: signals.filter((signal) => signal.candidateForOpportunity),
      },
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
