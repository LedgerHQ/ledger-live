import { useMemo } from "react";
import { useLocation, useParams } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { REFETCH_TIME_ONE_MINUTE, BASIC_REFETCH } from "@ledgerhq/live-common/market/utils/timers";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { selectCurrency } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useDistribution } from "~/renderer/actions/general";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { decodeRouteParam } from "../utils/decodeRouteParam";
import { resolveAssetDetailMarketInfo, isMarketCurrencyData } from "../utils/assetDetailMarketInfo";
import { resolveDistributionItem } from "../utils/resolveDistributionItem";
import { type AssetDetailViewModel } from "../types";

export function useAssetDetailViewModel(): AssetDetailViewModel {
  const { "*": routeAssetId } = useParams<{ "*": string }>();
  const location = useLocation();
  const distribution = useDistribution({ groupBy: "asset" });
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();

  const marketState = isMarketCurrencyData(location.state) ? location.state : undefined;
  const decodedAssetId = routeAssetId ? decodeRouteParam(routeAssetId) : undefined;

  const distributionItem = useMemo(
    () => resolveDistributionItem({ routeAssetId, decodedAssetId, marketState, distribution }),
    [routeAssetId, decodedAssetId, marketState, distribution],
  );

  const currencyDataQueryId = distributionItem?.currency.id ?? decodedAssetId;

  const { data: marketFromHook, isLoading: isLoadingMarket } = useGetCurrencyDataQuery(
    { id: currencyDataQueryId ?? "", counterCurrency },
    {
      skip: !currencyDataQueryId,
      pollingInterval: REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
    },
  );

  const ledgerIds = useMemo(() => {
    if (distributionItem) return [distributionItem.currency.id];
    return resolveAssetDetailMarketInfo(marketFromHook, marketState)?.ledgerIds;
  }, [distributionItem, marketFromHook, marketState]);

  const { data: assetData, isLoading: isLoadingDada } = assetsDataApi.useGetAssetDataQuery(
    {
      currencyIds: ledgerIds ?? [],
      product: "lld",
      version: __APP_VERSION__,
      isStaging: false,
    },
    { skip: !ledgerIds?.length },
  );

  const dadaMarketForDistribution = distributionItem
    ? assetData?.markets[distributionItem.currency.id]
    : undefined;

  const marketInfo = resolveAssetDetailMarketInfo(
    dadaMarketForDistribution,
    marketFromHook,
    marketState,
  );

  const ledgerCurrencyFromDada = assetData ? selectCurrency(assetData) : undefined;
  const ledgerCurrency = distributionItem ? distributionItem.currency : ledgerCurrencyFromDada;

  if (distributionItem || marketInfo) {
    const marketCurrencyQueryId =
      distributionItem?.currency.id ??
      marketInfo?.id ??
      marketInfo?.ledgerIds?.[0] ??
      decodedAssetId;

    return {
      mode: "ready",
      distributionItem,
      marketInfo,
      ledgerCurrency,
      assetName: distributionItem?.currency.name ?? marketInfo?.name ?? "",
      assetTicker: distributionItem?.currency.ticker ?? marketInfo?.ticker ?? "",
      ledgerId: ledgerCurrency?.id ?? marketInfo?.ledgerIds?.[0],
      marketCurrencyQueryId,
      isLoading: isLoadingDada,
    };
  }

  if (isLoadingMarket) return { mode: "loading" };

  return { mode: "not-found" };
}
