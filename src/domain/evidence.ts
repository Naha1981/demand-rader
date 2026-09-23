import { z } from "zod";

export const EvidenceSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceUrl: z.string().url(),
  publisher: z.string().optional(),

  observedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().optional(),
  availableAt: z.string().datetime(),

  signalType: z.string(),

  geographies: z.array(z.string()),

  independenceGroup: z.string(),

  contentHash: z.string(),

  epistemicType: z.enum([
    "OBSERVED",
    "REPORTED",
    "DERIVED",
    "INFERRED",
    "HYPOTHESIZED",
  ]),

  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
