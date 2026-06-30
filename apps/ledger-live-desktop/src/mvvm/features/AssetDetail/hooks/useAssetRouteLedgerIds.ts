import { useMemo } from "react";
import { useLocation } from "react-router";
import { isMarketCurrencyData, useAssetMarketData } from "@ledgerhq/asset-detail";
import {
  resolveAssetMarketInputs,
  resolveDistributionItem,
} from "@ledgerhq/asset-aggregation/assetDistribution/index";
import { useSelector } from "LLD/hooks/redux";
import { useDistribution } from "~/renderer/actions/general";
import {
  counterValueCurrencySelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";
import { decodeRouteParam } from "../utils/decodeRouteParam";

export function useAssetRouteLedgerIds(routeAssetId?: string): {
  ledgerIds: string[];
  isLoading: boolean;
} {
  const location = useLocation();
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker.toLowerCase();
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const distribution = useDistribution({
    groupBy: "asset",
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
  });

  const marketState = isMarketCurrencyData(location.state) ? location.state : undefined;
  const decodedAssetId = routeAssetId ? decodeRouteParam(routeAssetId) : undefined;

  const distributionItem = useMemo(
    () => resolveDistributionItem({ routeAssetId, decodedAssetId, marketState, distribution }),
    [routeAssetId, decodedAssetId, marketState, distribution],
  );

  const { marketApiId, knownLedgerIds } = useMemo(
    () => resolveAssetMarketInputs({ distributionItem, marketState, fallbackId: decodedAssetId }),
    [distributionItem, marketState, decodedAssetId],
  );

  const { ledgerIds, isLoading } = useAssetMarketData({
    marketApiId,
    knownLedgerIds,
    counterCurrency,
    product: "lld",
    version: __APP_VERSION__,
    knownMarketId: marketState?.id,
    // Off-route (e.g. "/", "/analytics") there is no asset to resolve.
    enabled: Boolean(routeAssetId),
  });

  return { ledgerIds, isLoading };
}
