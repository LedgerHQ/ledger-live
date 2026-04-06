import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useSelector } from "LLD/hooks/redux";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { buildPlaceholderAssetItemsFromAssetsData } from "LLD/features/Assets/utils/buildPlaceholderAssetItemsFromAssetsData";
import { parseAssetsPageCategory } from "LLD/features/Assets/utils/buildAssetsPagePath";
import { padItems, dadaIdToMarketId } from "LLD/features/Assets/utils/assetTableHelpers";
import {
  ASSETS_PAGE_CATEGORY_CRYPTOS,
  ASSETS_PAGE_CATEGORY_STABLECOINS,
  EMPTY_STATE_CRYPTOS,
  EMPTY_STATE_STABLECOINS,
} from "LLD/features/Assets/constants";
import type { AssetTableItem } from "LLD/features/Assets/types";
import type { CryptoAssetsViewModel } from "../types";
import { track } from "~/renderer/analytics/segment";
import { ASSETS_TRACKING_PAGE_NAME } from "../constants";

export default function useCryptoAssetsViewModel(): CryptoAssetsViewModel {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = useMemo(() => parseAssetsPageCategory(searchParams), [searchParams]);

  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const isEmptyState = !hasOnboardedDevice || !hasAccount;

  const { categorizedAssets, isLoadingStablecoinTickers, stablecoinTickers } =
    useCategorizedAssetsFromPortfolio();

  const needsCryptoPlaceholders =
    category === ASSETS_PAGE_CATEGORY_CRYPTOS &&
    (isEmptyState || categorizedAssets.cryptos.length < EMPTY_STATE_CRYPTOS);

  const needsStablecoinPlaceholders =
    category === ASSETS_PAGE_CATEGORY_STABLECOINS &&
    (isEmptyState || categorizedAssets.stablecoins.length < EMPTY_STATE_STABLECOINS);

  const { data: assetsData, isLoading: isLoadingAssetsData } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
    skip: !needsCryptoPlaceholders && !needsStablecoinPlaceholders,
  });

  const resolvedDefaults = useMemo(
    () =>
      assetsData
        ? buildPlaceholderAssetItemsFromAssetsData(assetsData, stablecoinTickers)
        : { cryptos: [] as AssetTableItem[], stablecoins: [] as AssetTableItem[] },
    [assetsData, stablecoinTickers],
  );

  const items = useMemo((): AssetTableItem[] => {
    if (category === ASSETS_PAGE_CATEGORY_CRYPTOS) {
      if (isEmptyState) {
        return padItems([], resolvedDefaults.cryptos, EMPTY_STATE_CRYPTOS);
      }
      const real = categorizedAssets.cryptos.map(item => ({ ...item, isPlaceholder: false }));
      return padItems(real, resolvedDefaults.cryptos, EMPTY_STATE_CRYPTOS);
    }
    if (isEmptyState) {
      return padItems([], resolvedDefaults.stablecoins, EMPTY_STATE_STABLECOINS);
    }
    const real = categorizedAssets.stablecoins.map(item => ({ ...item, isPlaceholder: false }));
    return padItems(real, resolvedDefaults.stablecoins, EMPTY_STATE_STABLECOINS);
  }, [
    category,
    isEmptyState,
    categorizedAssets.cryptos,
    categorizedAssets.stablecoins,
    resolvedDefaults.cryptos,
    resolvedDefaults.stablecoins,
  ]);

  const needsPaddingForCategory =
    category === ASSETS_PAGE_CATEGORY_CRYPTOS
      ? needsCryptoPlaceholders
      : needsStablecoinPlaceholders;

  const isLoading = needsPaddingForCategory
    ? isLoadingAssetsData || isLoadingStablecoinTickers
    : isLoadingStablecoinTickers;

  const title =
    category === ASSETS_PAGE_CATEGORY_CRYPTOS ? t("assets.cryptos") : t("assets.stablecoins");

  const onBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const onAssetRowClick = useCallback(
    (item: AssetTableItem) => {
      setTrackingSource(ASSETS_TRACKING_PAGE_NAME);
      track("asset_clicked", {
        asset: item.currency.name,
        page: ASSETS_TRACKING_PAGE_NAME,
      });
      navigate(
        item.isPlaceholder
          ? `/market/${encodeURIComponent(dadaIdToMarketId(item.marketId ?? item.currency.id))}`
          : `/asset/${item.currency.id}`,
      );
    },
    [navigate],
  );

  return {
    title,
    onBack,
    items,
    isLoading,
    onAssetRowClick,
    trackingType: category === ASSETS_PAGE_CATEGORY_CRYPTOS ? "crypto" : "stable",
  };
}
