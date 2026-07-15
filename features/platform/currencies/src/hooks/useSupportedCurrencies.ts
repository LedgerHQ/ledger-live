import { useMemo } from "react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useFeatureFlaggedCurrencies } from "./useFeatureFlaggedCurrencies";

export interface UseSupportedCurrenciesOptions {
  /** When true (e.g. Playwright runs) no currency is gated out. */
  mock?: boolean;
}

/**
 * Applies feature-flag gating to a registry-backed supported-currency list.
 *
 * Support is registry-driven (coin-module loaders); this hook does
 * NOT maintain its own list. The caller passes the registry-backed set (e.g.
 * live-common's `listSupportedCurrencies()`); the hook returns it minus the
 * currencies whose gating feature flag is disabled.
 */
export function useSupportedCurrencies(
  supportedCurrencies: CryptoCurrency[],
  { mock = false }: UseSupportedCurrenciesOptions = {},
): CryptoCurrency[] {
  const { deactivatedCurrencyIds } = useFeatureFlaggedCurrencies(mock);
  return useMemo(
    () => supportedCurrencies.filter(c => !deactivatedCurrencyIds.has(c.id)),
    [supportedCurrencies, deactivatedCurrencyIds],
  );
}
