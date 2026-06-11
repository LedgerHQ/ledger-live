import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  type RampExchangeNavigationOptions,
  useRampExchangeNavigation,
} from "./useRampExchangeNavigation";

type NavigateToBuy = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
  options?: RampExchangeNavigationOptions,
) => void;

interface UseBuyNavigationResult {
  navigateToBuy: NavigateToBuy;
}

export function useBuyNavigation(): UseBuyNavigationResult {
  const navigateToBuy = useRampExchangeNavigation("buy");
  return { navigateToBuy };
}
