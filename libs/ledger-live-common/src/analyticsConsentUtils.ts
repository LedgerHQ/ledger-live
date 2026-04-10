import { CURRENT_PRIVACY_POLICY_VERSION } from "./privacyConsent";

export const CONSENT_RENEWAL_INTERVAL_MS: number = 365 * 24 * 60 * 60 * 1000;

export type AnalyticsConsentPhase = "closed" | "privacy" | "consentFresh" | "consentReconfirm";

export function resolveAnalyticsConsentPhase(
  currentPhase: AnalyticsConsentPhase,
  needsRenewal: boolean,
  needsUpdatePrivacy: boolean,
  analyticsSharingEnabled: boolean,
): AnalyticsConsentPhase {
  if (currentPhase !== "closed") return currentPhase;
  if (needsRenewal) return analyticsSharingEnabled ? "consentReconfirm" : "consentFresh";
  if (needsUpdatePrivacy) return "privacy";
  return "consentFresh";
}

export function needsPrivacyPolicyAck(
  storedVersion: number | null,
  currentVersion: number = CURRENT_PRIVACY_POLICY_VERSION,
): boolean {
  if (storedVersion == null) return true;
  return storedVersion < currentVersion;
}

function consentDateToMs(consentDateIso: string | null): number | null {
  if (consentDateIso == null || consentDateIso === "") return null;
  const t = Date.parse(consentDateIso);
  return Number.isNaN(t) ? null : t;
}

export function needsConsentRenewal(
  consentDateIso: string | null,
  now: number = Date.now(),
  renewalIntervalMs: number | null = CONSENT_RENEWAL_INTERVAL_MS,
): boolean {
  const ms = consentDateToMs(consentDateIso);
  if (ms == null) return true;
  if (renewalIntervalMs === null || renewalIntervalMs === Number.POSITIVE_INFINITY) {
    return false;
  }
  return now - ms > renewalIntervalMs;
}
