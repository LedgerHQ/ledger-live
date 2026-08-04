import type { AnalyticsConsentDecision, AnalyticsConsentPhase } from "../types";

export function resolveAnalyticsConsentPhase(
  currentPhase: AnalyticsConsentPhase,
  decision: AnalyticsConsentDecision,
  analyticsSharingEnabled: boolean,
): AnalyticsConsentPhase {
  if (currentPhase !== "closed") return currentPhase;
  if (decision.kind === "renewal") {
    return analyticsSharingEnabled ? "consentReconfirm" : "consentFresh";
  }
  if (decision.kind === "privacy") return "privacy";
  return "closed";
}
