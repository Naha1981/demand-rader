import type { SocialEvidence, SocialSignal } from "./types.js";

const SERVICE_TERMS = [
  "roof repair",
  "roof repairs",
  "roofing",
  "roof replacement",
  "roof inspection",
  "roof leak",
  "leaking roof",
  "ceiling leak",
  "hail damage",
  "storm damage",
  "roof damage",
];

const REQUEST_TERMS = [
  "need a roofer",
  "need roofer",
  "looking for a roofer",
  "looking for roofing",
  "looking for someone to repair",
  "can anyone recommend",
  "anyone recommend",
  "please recommend",
  "recommend a roofer",
  "who can repair",
  "who can fix",
  "where can i find",
  "need someone to fix",
  "need someone to repair",
  "quote for",
  "quotation for",
  "roof repair quote",
];

const DAMAGE_TERMS = [
  "roof is leaking",
  "roof leaking",
  "roof is damaged",
  "roof damage",
  "storm damaged",
  "hail damaged",
  "hail hit",
  "storm hit",
  "water coming through",
  "water is coming through",
  "ceiling is leaking",
];

const RECOMMENDATION_TERMS = [
  "recommend",
  "recommendation",
  "referral",
  "who do you use",
  "who can help",
];

function normalized(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function matches(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(term));
}

export type RoofingSocialPolicy = {
  geographyTerms: string[];
  requireGeographyForCandidate?: boolean;
};

export function evaluateRoofingSignal(
  evidence: SocialEvidence,
  policy: RoofingSocialPolicy,
): SocialSignal {
  const text = normalized(evidence.text);
  const serviceMatches = matches(text, SERVICE_TERMS);
  const requestMatches = matches(text, REQUEST_TERMS);
  const damageMatches = matches(text, DAMAGE_TERMS);
  const recommendationMatches = matches(text, RECOMMENDATION_TERMS);
  const geographyMatches = policy.geographyTerms.filter((term) => text.includes(normalized(term)));
  const mentionsRoof = /\broof\b/.test(text);

  if (requestMatches.length > 0 && serviceMatches.length === 0) {
    return {
      evidenceId: evidence.id,
      signalType: "RECOMMENDATION_REQUEST",
      demandState: "INFORMATION_ONLY",
      geographyMatched: geographyMatches.length > 0,
      candidateForOpportunity: false,
      requiresHumanReview: true,
      matchedTerms: requestMatches,
      reasons: ["Recommendation language was observed, but the request did not contain a roofing service term."],
    };
  }

  if (requestMatches.length > 0 && serviceMatches.length > 0) {
    const geographyMatched = geographyMatches.length > 0;
    const candidate = geographyMatched || policy.requireGeographyForCandidate === false;
    return {
      evidenceId: evidence.id,
      signalType: "EXPLICIT_SERVICE_REQUEST",
      demandState: "SERVICE_INTEREST",
      geographyMatched,
      candidateForOpportunity: candidate,
      requiresHumanReview: true,
      matchedTerms: [...new Set([...requestMatches, ...serviceMatches, ...geographyMatches])],
      reasons: [
        "The source explicitly references a roofing service need.",
        ...(geographyMatched
          ? ["Configured geography evidence was found in the captured text."]
          : ["Geography was not independently confirmed in the captured text."]),
        "Human review is required before commercial activation.",
      ],
    };
  }

  if (damageMatches.length > 0 && (serviceMatches.length > 0 || mentionsRoof)) {
    return {
      evidenceId: evidence.id,
      signalType: "DAMAGE_REPORT",
      demandState: "INFORMATION_ONLY",
      geographyMatched: geographyMatches.length > 0,
      candidateForOpportunity: false,
      requiresHumanReview: true,
      matchedTerms: [...new Set([...damageMatches, ...serviceMatches, ...(mentionsRoof ? ["roof"] : [])])],
      reasons: ["A roofing-related damage condition was observed, but no explicit request for service was captured."],
    };
  }

  if (recommendationMatches.length > 0 && serviceMatches.length > 0) {
    return {
      evidenceId: evidence.id,
      signalType: "RECOMMENDATION_REQUEST",
      demandState: "INFORMATION_ONLY",
      geographyMatched: geographyMatches.length > 0,
      candidateForOpportunity: false,
      requiresHumanReview: true,
      matchedTerms: [...new Set([...recommendationMatches, ...serviceMatches])],
      reasons: ["Recommendation language is present alongside a roofing term, but the request is not explicit enough for candidate creation."],
    };
  }

  return {
    evidenceId: evidence.id,
    signalType: "RELATED_DISCUSSION",
    demandState: "NO_VERIFIED_DEMAND",
    geographyMatched: geographyMatches.length > 0,
    candidateForOpportunity: false,
    requiresHumanReview: true,
    matchedTerms: [],
    reasons: ["The captured text does not satisfy the initial roofing-demand policy."],
  };
}

export function evaluateRoofingSignals(
  evidence: SocialEvidence[],
  policy: RoofingSocialPolicy,
): SocialSignal[] {
  return evidence.map((item) => evaluateRoofingSignal(item, policy));
}
