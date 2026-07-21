import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import {
  type RampExchangeNavigationOptions,
  useRampExchangeNavigation,
} from "./useRampExchangeNavigation";

type NavigateToSell = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
  options?: RampExchangeNavigationOptions,
) => void;

interface UseSellNavigationResult {
  navigateToSell: NavigateToSell;
}

export function useSellNavigation(): UseSellNavigationResult {
  const navigateToSell = useRampExchangeNavigation("sell");
  return { navigateToSell };
}
