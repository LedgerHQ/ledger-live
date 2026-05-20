import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useRampExchangeNavigation } from "./useRampExchangeNavigation";

type NavigateToSell = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
) => void;

interface UseSellNavigationResult {
  navigateToSell: NavigateToSell;
}

export function useSellNavigation(): UseSellNavigationResult {
  const navigateToSell = useRampExchangeNavigation("sell");
  return { navigateToSell };
}
