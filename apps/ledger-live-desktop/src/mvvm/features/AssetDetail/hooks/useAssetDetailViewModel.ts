import { useMemo } from "react";
import { useLocation, useParams } from "react-router";
import {
  isMarketCurrencyData,
  resolveAssetDetailMarketInfo,
  useAssetMarketData,
} from "@ledgerhq/asset-detail";
import { useSelector } from "LLD/hooks/redux";
import { useDistribution } from "~/renderer/actions/general";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { decodeRouteParam } from "../utils/decodeRouteParam";
import { resolveDistributionItem } from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { type AssetDetailViewModel } from "../types";

export function useAssetDetailViewModel(): AssetDetailViewModel {
  const { "*": routeAssetId } = useParams<{ "*": string }>();
  const location = useLocation();
  const distribution = useDistribution({ groupBy: "asset" });
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();

  const marketState = isMarketCurrencyData(location.state) ? location.state : undefined;
  const decodedAssetId = routeAssetId ? decodeRouteParam(routeAssetId) : undefined;

  const distributionItem = useMemo(
    () => resolveDistributionItem({ routeAssetId, decodedAssetId, marketState, distribution }),
    [routeAssetId, decodedAssetId, marketState, distribution],
  );

  const marketApiId =
    distributionItem?.marketId ??
    distributionItem?.slug ??
    distributionItem?.currency.id ??
    decodedAssetId;
  const knownLedgerIds = useMemo<readonly string[] | undefined>(() => {
    if (distributionItem) return [distributionItem.currency.id];
    return marketState?.ledgerIds;
  }, [distributionItem, marketState]);

  const { marketCurrencyData, marketId, ledgerCurrencyFromDada, isLoading } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    counterCurrency,
    product: "lld",
    version: __APP_VERSION__,
    knownMarketId: marketState?.id,
  });

  const marketFallback = resolveAssetDetailMarketInfo(marketCurrencyData, marketState);

  const ledgerCurrency = distributionItem?.currency ?? ledgerCurrencyFromDada;

  if (distributionItem || marketFallback) {
    return {
      mode: "ready",
      distributionItem,
      marketData: { marketCurrencyData, marketId, isLoading },
      isDistributionLoading: distribution.isLoading,
      ledgerCurrency,
      displayName: ledgerCurrency?.name ?? marketFallback?.name ?? "",
      displayTicker: (ledgerCurrency?.ticker ?? marketFallback?.ticker ?? "").toUpperCase(),
      ledgerId: ledgerCurrency?.id ?? marketFallback?.ledgerIds?.[0],
    };
  }

  if (isLoading || distribution.isLoading) {
    return {
      mode: "ready",
      distributionItem,
      marketData: { marketCurrencyData, marketId, isLoading },
      isDistributionLoading: distribution.isLoading,
      ledgerCurrency,
      displayName: ledgerCurrency?.name ?? "",
      displayTicker: (ledgerCurrency?.ticker ?? "").toUpperCase(),
      ledgerId: ledgerCurrency?.id ?? decodedAssetId,
    };
  }

  return { mode: "not-found" };
}
