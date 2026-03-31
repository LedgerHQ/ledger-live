import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";

export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type ConsentDrawerPhase = "closed" | "privacy" | "consentFresh" | "consentReconfirm";

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
  oneYearMs: number = ONE_YEAR_MS,
): boolean {
  const ms = consentDateToMs(consentDateIso);
  if (ms == null) return true;
  return now - ms > oneYearMs;
}
