import { mkdir, readFile, writeFile } from "node:fs/promises";
import { EvidenceSchema, type Evidence } from "./domain/evidence.js";
import { MarketEventSchema } from "./domain/event.js";
import { BusinessSchema } from "./domain/business.js";
import { weatherOnly } from "./models/weather-only.js";
import { weatherConsequence } from "./models/weather-consequence.js";
import { behavior } from "./models/behavior.js";
import { businessFit } from "./models/business-fit.js";
import { summarizeModel } from "./metrics/metrics.js";

async function loadJson<T>(
  path: string,
  parse: (value: unknown) => T,
): Promise<T> {
  const raw = await readFile(path, "utf8");
  return parse(JSON.parse(raw));
}

const event = await loadJson(
  "fixtures/ge-001/event.json",
  (value) => MarketEventSchema.parse(value),
);

const evidence = await loadJson<Evidence[]>(
  "fixtures/ge-001/evidence.json",
  (value) =>
    Array.isArray(value)
      ? value.map((item) => EvidenceSchema.parse(item))
      : EvidenceSchema.array().parse(value),
);

const business = await loadJson(
  "fixtures/ge-001/business.json",
  (value) => BusinessSchema.parse(value),
);

const modelFns = {
  MODEL_A_WEATHER_ONLY: weatherOnly,
  MODEL_B_WEATHER_CONSEQUENCE: weatherConsequence,
  MODEL_C_BEHAVIOR: behavior,
  MODEL_D_BUSINESS_FIT: businessFit,
} as const;

const decisions = Object.fromEntries(
  Object.entries(modelFns).map(([name, fn]) => [
    name,
    event.replayCheckpoints.map((replayTime) =>
      fn(event, evidence, business, new Date(replayTime)),
    ),
  ]),
);

const report = {
  eventId: event.id,
  generatedAt: new Date().toISOString(),
  replayCheckpoints: event.replayCheckpoints,
  businessId: business.id,
  models: Object.fromEntries(
    Object.entries(decisions).map(([name, modelDecisions]) => [
      name,
      {
        decisions: modelDecisions,
        metrics: summarizeModel(modelDecisions),
      },
    ]),
  ),
};

await mkdir("reports/generated", { recursive: true });
await writeFile(
  "reports/generated/ge-001.json",
  JSON.stringify(report, null, 2) + "\n",
);

console.log(JSON.stringify(report, null, 2));
