import { add, isAfter, isValid, parseISO } from "date-fns";

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
  currentVersion: number,
): boolean {
  if (storedVersion == null) return true;
  return storedVersion < currentVersion;
}

export function needsConsentRenewal(
  consentDateIso: string | null,
  consentValidityDays: number,
  now: Date = new Date(),
): boolean {
  if (consentDateIso == null || consentDateIso === "") return true;
  const consentDate = parseISO(consentDateIso);
  if (!isValid(consentDate)) return true;
  const deadline = add(consentDate, { days: consentValidityDays });
  return isAfter(now, deadline);
}
