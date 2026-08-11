import type { PolicyVersion } from "@domain/entity-analytics-consent";

export type AnalyticsConsentRenewalReason =
  | "consent_date_missing"
  | "consent_date_invalid"
  | "stored_version_missing"
  | "stored_version_invalid"
  | "major_bump";

export type AnalyticsConsentNoneReason =
  | "up_to_date"
  | "current_version_invalid"
  | "stored_version_newer";

/**
 * `renewal` requires a fresh analytics choice and disables optional analytics meanwhile.
 * `privacy` only asks the user to acknowledge the new privacy policy.
 */
export type AnalyticsConsentDecision =
  | { kind: "renewal"; reason: AnalyticsConsentRenewalReason }
  | { kind: "privacy"; reason: "minor_bump" }
  | { kind: "none"; reason: AnalyticsConsentNoneReason };

export type AnalyticsConsentContext = {
  currentPolicyVersion: PolicyVersion | null;
};

export type AnalyticsOptInParams = {
  currentPolicyVersion: PolicyVersion | null;
};

export type AnalyticsConsentPhase = "closed" | "privacy" | "consentFresh" | "consentReconfirm";
