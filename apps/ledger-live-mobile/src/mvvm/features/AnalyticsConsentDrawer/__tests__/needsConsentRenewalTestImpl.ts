/**
 * Mirrors `needsConsentRenewal` in **`libs/ledger-live-common/src/analyticsConsentUtils.ts`**
 * (`needsConsentRenewal`, `consentDateToMs`). Keep this file aligned when that implementation changes.
 *
 * Used for `jest.spyOn(..., "needsConsentRenewal")` without `jest.requireActual` + spy recursion on the live export.
 */
export function consentDateToMs(consentDateIso: string | null): number | null {
  if (consentDateIso == null || consentDateIso === "") return null;
  const t = Date.parse(consentDateIso);
  return Number.isNaN(t) ? null : t;
}

export function needsConsentRenewalTestImpl(
  consentDateIso: string | null,
  now: number,
  renewalIntervalMs: number | null,
): boolean {
  const ms = consentDateToMs(consentDateIso);
  if (ms == null) return true;
  if (renewalIntervalMs === null || renewalIntervalMs === Number.POSITIVE_INFINITY) {
    return false;
  }
  return now - ms > renewalIntervalMs;
}
