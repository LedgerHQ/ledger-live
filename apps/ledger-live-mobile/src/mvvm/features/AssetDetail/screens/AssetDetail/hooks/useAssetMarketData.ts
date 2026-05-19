import VersionNumber from "react-native-version-number";
import { useAssetMarketData as useSharedAssetMarketData } from "@ledgerhq/asset-detail";
import { useSelector } from "~/context/hooks";
import { marketParamsSelector } from "~/reducers/market";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export function useAssetMarketData(currency: AssetDetailCurrencyProps) {
  const marketParams = useSelector(marketParamsSelector);
  const { counterCurrency = "usd" } = marketParams;

  const knownLedgerIds = currency ? [currency.id] : undefined;

  const { marketCurrencyData, marketId, isLoading, isError } = useSharedAssetMarketData({
    marketApiId: currency?.id,
    knownLedgerIds,
    counterCurrency,
    product: "llm",
    version: VersionNumber.appVersion,
  });

  return {
    marketCurrency: marketCurrencyData,
    marketId,
    counterCurrency,
    isLoading,
    isError,
  };
}
