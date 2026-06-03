import VersionNumber from "react-native-version-number";
import { useAssetMarketData as useSharedAssetMarketData } from "@ledgerhq/asset-detail";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";

type Params = {
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
};

/**
 * Mobile wrapper around `useAssetMarketData` from `@ledgerhq/asset-detail`.
 * Inputs must be already resolved — see `resolveAssetMarketInputs` from
 * `@ledgerhq/asset-aggregation`. No silent fallback to `currency.id` so a
 * mismatch between ledger id and market id (e.g. BNB → "bsc" vs "binancecoin")
 * cannot reintroduce the wrong query.
 */
export function useAssetMarketData({ marketApiId, knownLedgerIds, knownMarketId }: Params) {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();

  const { marketCurrencyData, marketId, ledgerIds, isLoading, isError } = useSharedAssetMarketData({
    marketApiId,
    knownLedgerIds,
    counterCurrency,
    product: "llm",
    version: VersionNumber.appVersion,
    knownMarketId,
  });

  return {
    marketCurrency: marketCurrencyData,
    marketId,
    counterCurrency,
    ledgerIds,
    isLoading,
    isError,
  };
}
