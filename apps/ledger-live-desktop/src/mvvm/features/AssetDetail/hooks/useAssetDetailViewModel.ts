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
import { resolveDistributionItem } from "../utils/resolveDistributionItem";
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

  const marketApiCurrencyId = distributionItem?.currency.id ?? decodedAssetId;
  const knownLedgerIds = useMemo<readonly string[] | undefined>(() => {
    if (distributionItem) return [distributionItem.currency.id];
    return marketState?.ledgerIds;
  }, [distributionItem, marketState]);

  const { marketCurrencyData, ledgerCurrencyFromDada, isLoading } = useAssetMarketData({
    marketApiCurrencyId,
    knownLedgerIds,
    counterCurrency,
    product: "lld",
    version: __APP_VERSION__,
  });

  const marketInfo = resolveAssetDetailMarketInfo(marketCurrencyData, marketState);

  const ledgerCurrency = distributionItem?.currency ?? ledgerCurrencyFromDada;

  if (distributionItem || marketInfo) {
    return {
      mode: "ready",
      distributionItem,
      marketInfo,
      market: { marketCurrencyData, isLoading },
      ledgerCurrency,
      assetName: ledgerCurrency?.name ?? marketInfo?.name ?? "",
      assetTicker: ledgerCurrency?.ticker ?? marketInfo?.ticker ?? "",
      ledgerId: ledgerCurrency?.id ?? marketInfo?.ledgerIds?.[0],
      isLoading,
    };
  }

  if (isLoading) return { mode: "loading" };

  return { mode: "not-found" };
}
