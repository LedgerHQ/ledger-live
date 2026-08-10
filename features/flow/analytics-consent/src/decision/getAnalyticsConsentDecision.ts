import {
  comparePolicyVersions,
  parseStoredPolicyVersion,
  type AnalyticsConsentInfo,
} from "@domain/entity-analytics-consent";
import { getConsentDateState } from "../utils/getConsentDateState";
import type {
  AnalyticsConsentContext,
  AnalyticsConsentDecision,
  AnalyticsConsentRenewalReason,
} from "../types";

const RENEWAL_REASON_BY_DATE_STATE = {
  missing: "consent_date_missing",
  invalid: "consent_date_invalid",
} as const satisfies Record<string, AnalyticsConsentRenewalReason>;

/**
 * Single verdict shared by the consent drawer and the tracking gate.
 * Renewal outranks privacy acknowledgement; an invalid current version disables version checks.
 */
export function getAnalyticsConsentDecision(
  { consentDate, privacyPolicyVersion }: AnalyticsConsentInfo,
  { currentPolicyVersion }: AnalyticsConsentContext,
): AnalyticsConsentDecision {
  const dateState = getConsentDateState(consentDate);
  if (dateState !== "valid") {
    return { kind: "renewal", reason: RENEWAL_REASON_BY_DATE_STATE[dateState] };
  }

  if (currentPolicyVersion === null) {
    return { kind: "none", reason: "current_version_invalid" };
  }

  const storedVersion = parseStoredPolicyVersion(privacyPolicyVersion);
  if (storedVersion === null) {
    return {
      kind: "renewal",
      reason: privacyPolicyVersion == null ? "stored_version_missing" : "stored_version_invalid",
    };
  }

  if (storedVersion.major < currentPolicyVersion.major) {
    return { kind: "renewal", reason: "major_bump" };
  }

  if (comparePolicyVersions(storedVersion, currentPolicyVersion) > 0) {
    return { kind: "none", reason: "stored_version_newer" };
  }

  if (storedVersion.minor < currentPolicyVersion.minor) {
    return { kind: "privacy", reason: "minor_bump" };
  }

  return { kind: "none", reason: "up_to_date" };
}
