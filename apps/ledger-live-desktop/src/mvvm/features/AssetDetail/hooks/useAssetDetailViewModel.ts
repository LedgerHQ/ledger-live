import { useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import {
  isMarketCurrencyData,
  resolveAssetDetailMarketInfo,
  useAssetMarketData,
} from "@ledgerhq/asset-detail";
import type { LineChartRange } from "LLD/components/LineChart";
import { useSelector } from "LLD/hooks/redux";
import { useDistribution } from "~/renderer/actions/general";
import {
  counterValueCurrencySelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { decodeRouteParam } from "../utils/decodeRouteParam";
import {
  resolveAssetMarketInputs,
  resolveDistributionItem,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { type AssetDetailViewModel } from "../types";

export function useAssetDetailViewModel(): AssetDetailViewModel {
  const { "*": routeAssetId } = useParams<{ "*": string }>();
  const location = useLocation();
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const distribution = useDistribution({
    groupBy: "asset",
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const [selectedRange, setSelectedRange] = useState<LineChartRange>("1d");

  const marketState = isMarketCurrencyData(location.state) ? location.state : undefined;
  const decodedAssetId = routeAssetId ? decodeRouteParam(routeAssetId) : undefined;

  const distributionItem = useMemo(
    () => resolveDistributionItem({ routeAssetId, decodedAssetId, marketState, distribution }),
    [routeAssetId, decodedAssetId, marketState, distribution],
  );

  const { marketApiId, knownLedgerIds } = useMemo(
    () =>
      resolveAssetMarketInputs({
        distributionItem,
        marketState,
        fallbackId: decodedAssetId,
      }),
    [distributionItem, marketState, decodedAssetId],
  );

  const {
    marketCurrencyData,
    marketId,
    ledgerCurrencyFromDada,
    ledgerIds: assetMarketLedgerIds,
    isLoading,
  } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    counterCurrency,
    product: "lld",
    version: __APP_VERSION__,
    knownMarketId: marketState?.id,
  });

  const marketFallback = resolveAssetDetailMarketInfo(marketCurrencyData, marketState);

  const ledgerCurrency = distributionItem?.currency ?? ledgerCurrencyFromDada;
  const ledgerIds = useMemo(() => {
    if (assetMarketLedgerIds?.length) return assetMarketLedgerIds;
    if (marketCurrencyData?.ledgerIds?.length) return marketCurrencyData.ledgerIds;
    return knownLedgerIds ? [...knownLedgerIds] : [];
  }, [assetMarketLedgerIds, marketCurrencyData?.ledgerIds, knownLedgerIds]);

  if (distributionItem || marketFallback) {
    return {
      mode: "ready",
      distributionItem,
      marketData: { marketCurrencyData, marketId, isLoading },
      isDistributionLoading: distribution.isLoading,
      ledgerCurrency,
      ledgerIds,
      displayName: ledgerCurrency?.name ?? marketFallback?.name ?? "",
      displayTicker: (ledgerCurrency?.ticker ?? marketFallback?.ticker ?? "").toUpperCase(),
      ledgerId: ledgerCurrency?.id ?? marketFallback?.ledgerIds?.[0],
      selectedRange,
      onRangeChange: setSelectedRange,
    };
  }

  if (isLoading || distribution.isLoading) {
    return {
      mode: "ready",
      distributionItem,
      marketData: { marketCurrencyData, marketId, isLoading },
      isDistributionLoading: distribution.isLoading,
      ledgerCurrency,
      ledgerIds,
      displayName: ledgerCurrency?.name ?? "",
      displayTicker: (ledgerCurrency?.ticker ?? "").toUpperCase(),
      ledgerId: ledgerCurrency?.id ?? decodedAssetId,
      selectedRange,
      onRangeChange: setSelectedRange,
    };
  }

  return { mode: "not-found" };
}
