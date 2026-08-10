import { parseConsentDate } from "@domain/entity-analytics-consent";

export type ConsentDateState = "missing" | "invalid" | "valid";

/**
 * A stored consent date never goes stale on its own: renewal is driven by `policyVersion` bumps,
 * so the date only tells us whether a consent choice was ever recorded and stored intact.
 */
export function getConsentDateState(consentDateIso: string | null): ConsentDateState {
  if (consentDateIso == null || consentDateIso === "") return "missing";
  return parseConsentDate(consentDateIso) === null ? "invalid" : "valid";
}
