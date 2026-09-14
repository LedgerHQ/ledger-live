import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

// A blocked region gets a redirect to the compliance page instead of the backend. axios follows it
// and replays the request there, where a POST answers 405.
const COMPLIANCE_STATUS = 405;

export function isRegionRestrictionCheckEnabled(config: CurrencyConfig | undefined): boolean {
  return config?.checkRegionRestriction === true;
}

export function isRegionRestrictedFailure(
  error: unknown,
  config: CurrencyConfig | undefined,
): boolean {
  if (!isRegionRestrictionCheckEnabled(config)) return false;

  const status = (error as { status?: unknown })?.status;
  return status === COMPLIANCE_STATUS;
}
