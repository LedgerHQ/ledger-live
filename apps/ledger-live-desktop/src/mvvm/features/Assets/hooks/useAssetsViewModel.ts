import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { AssetsViewProps, AssetTableItem } from "../types";
import { buildPlaceholderAssetItemsFromAssetsData } from "../utils/buildPlaceholderAssetItemsFromAssetsData";
import { useSelector } from "LLD/hooks/redux";
import {
  hasOnboardedDeviceSelector,
  counterValueCurrencySelector,
} from "~/renderer/reducers/settings";
import { useAllCurrencyTrends } from "./useAllCurrencyTrends";
import { useOnDemandCurrenciesCountervalues } from "~/renderer/hooks/useOnDemandCountervalues";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import {
  ASSETS_PAGE_CATEGORY_CRYPTOS,
  ASSETS_PAGE_CATEGORY_STABLECOINS,
  ASSETS_PRICE_REFRESH_INTERVAL_MS,
  EMPTY_STATE_CRYPTOS,
  EMPTY_STATE_STABLECOINS,
  MAX_ITEM_DISPLAYED,
} from "../constants";
import { buildAssetsPagePath } from "../utils/buildAssetsPagePath";
import { padItems } from "../utils/assetTableHelpers";
import { dadaIdToMarketId } from "@ledgerhq/live-common/market/utils/index";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { track } from "~/renderer/analytics/segment";
import {
  ASSETS_TRACKING_PAGE_NAME,
  CRYPTO_TRACKING_PAGE_NAME,
} from "../../CryptoAddresses/constants";

export function useAssetsViewModel(): AssetsViewProps {
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const isEmptyState = !hasOnboardedDevice || !hasAccount;

  const { categorizedAssets, isLoadingStablecoinTickers, stablecoinTickers } =
    useCategorizedAssetsFromPortfolio();

  const needsPadding =
    isEmptyState ||
    categorizedAssets.cryptos.length < EMPTY_STATE_CRYPTOS ||
    categorizedAssets.stablecoins.length < EMPTY_STATE_STABLECOINS;

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { status: rateStatus, rate } = useUsdToFiatRate(counterValueCurrency.ticker);

  const { data: assetsData, isLoading: isLoadingAssetsData } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
    pollingInterval: ASSETS_PRICE_REFRESH_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });

  const usdPriceById = useMemo(() => {
    const map = new Map<string, number>();
    if (!assetsData?.markets) return map;
    for (const [currencyId, market] of Object.entries(assetsData.markets)) {
      if (market?.price != null) map.set(currencyId, market.price);
    }
    return map;
  }, [assetsData]);

  const getMarketPrice = useCallback(
    (currencyId: string): number | undefined => {
      if (rateStatus !== "ready" || rate == null) return undefined;
      const usd = usdPriceById.get(currencyId);
      return usd != null ? usd * rate : undefined;
    },
    [rateStatus, rate, usdPriceById],
  );

  const navigate = useNavigate();
  const { t } = useTranslation();

  const onNavigateToCryptos = useCallback(() => {
    track("button_clicked", {
      button: "asset_list",
      type: "crypto",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    navigate(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_CRYPTOS));
  }, [navigate]);

  const onNavigateToCryptoAssets = useCallback(() => {
    track("button_clicked", {
      button: "asset_list",
      type: "stable",
      page: ASSETS_TRACKING_PAGE_NAME,
    });
    navigate(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_STABLECOINS));
  }, [navigate]);

  const onItemClick = useCallback(
    (item: AssetTableItem) => {
      setTrackingSource("asset allocation");
      const rawId = item.marketId ?? item.currency.id;
      navigate(
        item.isPlaceholder
          ? shouldDisplayAggregatedAssets
            ? `/asset/${encodeURIComponent(dadaIdToMarketId(rawId))}`
            : `/market/${encodeURIComponent(dadaIdToMarketId(rawId))}`
          : `/asset/${item.currency.id}`,
      );
    },
    [navigate, shouldDisplayAggregatedAssets],
  );

  const resolvedDefaults = useMemo(
    () =>
      assetsData
        ? buildPlaceholderAssetItemsFromAssetsData(assetsData, stablecoinTickers)
        : { cryptos: [], stablecoins: [] },
    [assetsData, stablecoinTickers],
  );

  const { paddedCryptos, paddedStablecoins } = useMemo(() => {
    const toRealItems = (items: typeof categorizedAssets.cryptos): AssetTableItem[] =>
      isEmptyState
        ? []
        : items.slice(0, MAX_ITEM_DISPLAYED).map(item => ({ ...item, isPlaceholder: false }));

    return {
      paddedCryptos: padItems(
        toRealItems(categorizedAssets.cryptos),
        resolvedDefaults.cryptos,
        EMPTY_STATE_CRYPTOS,
      ),
      paddedStablecoins: padItems(
        toRealItems(categorizedAssets.stablecoins),
        resolvedDefaults.stablecoins,
        EMPTY_STATE_STABLECOINS,
      ),
    };
  }, [isEmptyState, categorizedAssets, resolvedDefaults]);

  const allItems = useMemo(
    () => [...paddedCryptos, ...paddedStablecoins],
    [paddedCryptos, paddedStablecoins],
  );

  const nonPlaceholderCurrencies = useMemo(
    () => allItems.filter(i => !i.isPlaceholder).map(i => i.currency),
    [allItems],
  );
  useOnDemandCurrenciesCountervalues(nonPlaceholderCurrencies, counterValueCurrency);

  const trends = useAllCurrencyTrends(allItems, "day");

  const cryptosWithTrend = useMemo(
    () =>
      paddedCryptos.map(item => ({
        ...item,
        trend: trends.get(item.currency.id) ?? null,
        marketPrice: getMarketPrice(item.currency.id),
      })),
    [paddedCryptos, trends, getMarketPrice],
  );

  const stablecoinsWithTrend = useMemo(
    () =>
      paddedStablecoins.map(item => ({
        ...item,
        trend: trends.get(item.currency.id) ?? null,
        marketPrice: getMarketPrice(item.currency.id),
      })),
    [paddedStablecoins, trends, getMarketPrice],
  );

  const sections = useMemo(
    () => [
      {
        sectionId: "cryptos",
        title: t("assets.cryptos"),
        items: cryptosWithTrend,
        totalCount: isEmptyState ? paddedCryptos.length : categorizedAssets.cryptos.length,
        onNavigate: onNavigateToCryptos,
        onItemClick,
      },
      {
        sectionId: "stablecoins",
        title: t("assets.stablecoins"),
        items: stablecoinsWithTrend,
        totalCount: isEmptyState ? paddedStablecoins.length : categorizedAssets.stablecoins.length,
        onNavigate: onNavigateToCryptoAssets,
        onItemClick,
      },
    ],
    [
      isEmptyState,
      categorizedAssets,
      paddedCryptos,
      paddedStablecoins,
      cryptosWithTrend,
      stablecoinsWithTrend,
      onNavigateToCryptoAssets,
      onNavigateToCryptos,
      onItemClick,
      t,
    ],
  );

  return {
    isLoading: needsPadding
      ? isLoadingAssetsData ||
        isLoadingStablecoinTickers ||
        (!!assetsData && rateStatus === "loading")
      : isLoadingStablecoinTickers,
    sections,
  };
}
