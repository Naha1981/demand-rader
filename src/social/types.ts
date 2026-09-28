import { z } from "zod";

export const SocialPlatformSchema = z.enum(["instagram", "tiktok", "linkedin"]);
export type SocialPlatform = z.infer<typeof SocialPlatformSchema>;

export const SocialEvidenceSchema = z.object({
  id: z.string().min(1),
  platform: SocialPlatformSchema,
  sourceUrl: z.string().url(),
  sourceType: z.enum(["post", "profile", "company", "result"]),
  authorId: z.string().optional(),
  authorName: z.string().optional(),
  text: z.string().default(""),
  publishedAt: z.string().datetime().optional(),
  observedAt: z.string().datetime(),
  availableAt: z.string().datetime(),
  geographies: z.array(z.string()),
  independenceGroup: z.string().min(1),
  contentHash: z.string().min(1),
  epistemicType: z.enum(["OBSERVED", "DERIVED"]),
  accessState: z.enum(["PUBLIC", "LOGIN_REQUIRED", "CHALLENGE", "RATE_LIMITED", "BLOCKED", "INCOMPLETE"]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type SocialEvidence = z.infer<typeof SocialEvidenceSchema>;

export const SocialDemandStateSchema = z.enum([
  "NO_VERIFIED_DEMAND",
  "INFORMATION_ONLY",
  "SERVICE_INTEREST",
]);

export type SocialDemandState = z.infer<typeof SocialDemandStateSchema>;

export const SocialSignalSchema = z.object({
  evidenceId: z.string(),
  signalType: z.enum([
    "EXPLICIT_SERVICE_REQUEST",
    "RECOMMENDATION_REQUEST",
    "DAMAGE_REPORT",
    "RELATED_DISCUSSION",
  ]),
  demandState: SocialDemandStateSchema,
  geographyMatched: z.boolean(),
  candidateForOpportunity: z.boolean(),
  requiresHumanReview: z.boolean(),
  matchedTerms: z.array(z.string()),
  reasons: z.array(z.string()),
});

export type SocialSignal = z.infer<typeof SocialSignalSchema>;

export type JevSocialSearchOptions = {
  query: string;
  platform?: "auto" | SocialPlatform;
  limit?: number;
  maxSteps?: number;
  timeoutMs?: number;
  geographyTerms?: string[];
  packageSpec?: string;
  executable?: string;
  env?: NodeJS.ProcessEnv;
};

export type JevSocialRun = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  request?: string;
  query?: string;
  requestedPlatform?: string;
  platform?: string;
  status?: string;
  stopReason?: string;
  actions?: unknown[];
  classification?: unknown;
  result?: {
    ok?: boolean;
    query?: string;
    items?: unknown[];
  };
  report?: string;
  [key: string]: unknown;
};

export type NormalizedSocialScan = {
  runId: string;
  platform: SocialPlatform;
  status: string;
  stopReason?: string;
  evidence: SocialEvidence[];
  accessState: SocialEvidence["accessState"];
  elapsedMs?: number;
};
