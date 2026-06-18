import { useMemo } from "react";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import {
  isAvailableOnBuy,
  isAvailableOnSwap,
  type MarketCurrencyRampLedgerIds,
} from "LLD/features/Market/utils/rampCatalogAvailability";

export type TradeAvailability = Readonly<{
  availableOnBuy: boolean;
  availableOnSwap: boolean;
  isCurrencySupported: boolean;
  isResolved: boolean;
}>;

export function useTradeAvailability(ledgerIds: readonly string[] | undefined): TradeAvailability {
  const { isCurrencyAvailable, getSupportedCryptoCurrencyIds } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const swapSet = useMemo(() => new Set(currenciesForSwapAll ?? []), [currenciesForSwapAll]);

  const isRampCatalogResolved = useMemo(
    () => getSupportedCryptoCurrencyIds("onRamp") != null,
    [getSupportedCryptoCurrencyIds],
  );

  const activeIds = useMemo(
    () => (ledgerIds ?? []).filter(id => !deactivatedCurrencyIds.has(id)),
    [ledgerIds, deactivatedCurrencyIds],
  );

  const currencyRef = useMemo(
    (): MarketCurrencyRampLedgerIds | undefined =>
      activeIds.length > 0 ? { ledgerIds: activeIds } : undefined,
    [activeIds],
  );

  const availableOnBuy = useMemo(
    () => isAvailableOnBuy(currencyRef, isCurrencyAvailable),
    [currencyRef, isCurrencyAvailable],
  );

  const availableOnSwap = useMemo(
    () => isAvailableOnSwap(currencyRef, swapSet),
    [currencyRef, swapSet],
  );

  return {
    availableOnBuy,
    availableOnSwap,
    isCurrencySupported: activeIds.length > 0,
    isResolved: currenciesForSwapAll != null && isRampCatalogResolved,
  };
}
