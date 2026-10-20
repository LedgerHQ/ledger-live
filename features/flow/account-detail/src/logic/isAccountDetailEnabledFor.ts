import type { Features } from "@shared/feature-flags";

export type AccountDetailFeature = Features["accountDetail"];

export function isAccountDetailEnabledFor(
  feature: AccountDetailFeature | null | undefined,
  currencyId: string,
): boolean {
  if (feature?.enabled !== true) return false;
  return !(feature.params?.excludedCurrencyIds ?? []).includes(currencyId);
}
