import { EvidenceSchema, type Evidence } from "../domain/evidence.js";
import type { SocialEvidence, SocialSignal } from "./types.js";

export function toDemandRadarEvidence(
  evidence: SocialEvidence,
  signal?: SocialSignal,
): Evidence {
  return EvidenceSchema.parse({
    id: evidence.id,
    source: "social:" + evidence.platform,
    sourceUrl: evidence.sourceUrl,
    publisher: evidence.authorName,
    observedAt: evidence.observedAt,
    publishedAt: evidence.publishedAt,
    availableAt: evidence.availableAt,
    signalType: signal?.signalType ?? "SOCIAL_CONTENT",
    geographies: evidence.geographies,
    independenceGroup: evidence.independenceGroup,
    contentHash: evidence.contentHash,
    epistemicType: "OBSERVED",
    metadata: {
      platform: evidence.platform,
      sourceType: evidence.sourceType,
      accessState: evidence.accessState,
      text: evidence.text,
      ...(signal
        ? {
            demandState: signal.demandState,
            candidateForOpportunity: signal.candidateForOpportunity,
            requiresHumanReview: signal.requiresHumanReview,
            matchedTerms: signal.matchedTerms,
            signalReasons: signal.reasons,
          }
        : {}),
      ...evidence.metadata,
    },
  });
}

export function toDemandRadarEvidenceBatch(
  evidence: SocialEvidence[],
  signals: SocialSignal[] = [],
): Evidence[] {
  const byId = new Map(signals.map((signal) => [signal.evidenceId, signal]));
  return evidence.map((item) => toDemandRadarEvidence(item, byId.get(item.id)));
}
