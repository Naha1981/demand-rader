import { z } from "zod";

export const MarketEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  geographies: z.array(z.string()),
  severity: z.number().min(0).max(100).optional(),
  status: z.enum(["ACTIVE", "RESOLVED", "DISPUTED", "UNKNOWN"]),
  evidenceIds: z.array(z.string()),
  demandWindowHours: z.number().positive(),
  replayCheckpoints: z.array(z.string().datetime()),
});

export type MarketEvent = z.infer<typeof MarketEventSchema>;
