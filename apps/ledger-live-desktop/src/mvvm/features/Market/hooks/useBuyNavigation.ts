import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useRampExchangeNavigation } from "./useRampExchangeNavigation";

type NavigateToBuy = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
) => void;

interface UseBuyNavigationResult {
  navigateToBuy: NavigateToBuy;
}

export function useBuyNavigation(): UseBuyNavigationResult {
  const navigateToBuy = useRampExchangeNavigation("buy");
  return { navigateToBuy };
}
