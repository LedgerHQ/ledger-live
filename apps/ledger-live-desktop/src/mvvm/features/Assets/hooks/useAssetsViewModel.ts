import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { AssetsViewProps, AssetTableItem } from "../types";
import { buildPlaceholderAssetItemsFromAssetsData } from "../utils/buildPlaceholderAssetItemsFromAssetsData";
import { useSelector } from "LLD/hooks/redux";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import {
  ASSETS_PAGE_CATEGORY_CRYPTOS,
  ASSETS_PAGE_CATEGORY_STABLECOINS,
  EMPTY_STATE_CRYPTOS,
  EMPTY_STATE_STABLECOINS,
  MAX_ITEM_DISPLAYED,
} from "../constants";
import { buildAssetsPagePath } from "../utils/buildAssetsPagePath";
import { padItems, resolveMarketId } from "../utils/assetTableHelpers";
import { track } from "~/renderer/analytics/segment";
import {
  ASSETS_TRACKING_PAGE_NAME,
  CRYPTO_TRACKING_PAGE_NAME,
} from "../../CryptoAddresses/constants";

export function useAssetsViewModel(): AssetsViewProps {
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const isEmptyState = !hasOnboardedDevice || !hasAccount;

  const { categorizedAssets, isLoadingStablecoinTickers, stablecoinTickers } =
    useCategorizedAssetsFromPortfolio();

  const needsPadding =
    isEmptyState ||
    categorizedAssets.cryptos.length < EMPTY_STATE_CRYPTOS ||
    categorizedAssets.stablecoins.length < EMPTY_STATE_STABLECOINS;

  const { data: assetsData, isLoading: isLoadingAssetsData } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
    skip: !needsPadding,
  });

  const navigate = useNavigate();
  const { t } = useTranslation();

  const onNavigateToCryptos = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: CRYPTO_TRACKING_PAGE_NAME,
    });
    navigate(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_CRYPTOS));
  }, [navigate]);

  const onNavigateToCryptoAssets = useCallback(() => {
    track("button_clicked", {
      button: "account_cta",
      type: "view",
      page: ASSETS_TRACKING_PAGE_NAME,
    });
    navigate(buildAssetsPagePath(ASSETS_PAGE_CATEGORY_STABLECOINS));
  }, [navigate]);

  const onItemClick = useCallback(
    (item: AssetTableItem) => {
      setTrackingSource("asset allocation");
      navigate(
        item.isPlaceholder
          ? `/market/${encodeURIComponent(resolveMarketId(item.marketId ?? item.currency.id))}`
          : `/asset/${item.currency.id}`,
      );
    },
    [navigate],
  );

  const resolvedDefaults = useMemo(
    () =>
      assetsData
        ? buildPlaceholderAssetItemsFromAssetsData(assetsData, stablecoinTickers)
        : { cryptos: [], stablecoins: [] },
    [assetsData, stablecoinTickers],
  );

  const sections = useMemo(() => {
    const toRealItems = (items: typeof categorizedAssets.cryptos): AssetTableItem[] =>
      isEmptyState
        ? []
        : items.slice(0, MAX_ITEM_DISPLAYED).map(item => ({ ...item, isPlaceholder: false }));

    const realCryptos = toRealItems(categorizedAssets.cryptos);
    const realStablecoins = toRealItems(categorizedAssets.stablecoins);

    const paddedCryptos = padItems(realCryptos, resolvedDefaults.cryptos, EMPTY_STATE_CRYPTOS);
    const paddedStablecoins = padItems(
      realStablecoins,
      resolvedDefaults.stablecoins,
      EMPTY_STATE_STABLECOINS,
    );

    return [
      {
        sectionId: "cryptos",
        title: t("assets.cryptos"),
        items: paddedCryptos,
        totalCount: isEmptyState ? paddedCryptos.length : categorizedAssets.cryptos.length,
        onNavigate: onNavigateToCryptos,
        onItemClick,
      },
      {
        sectionId: "stablecoins",
        title: t("assets.stablecoins"),
        items: paddedStablecoins,
        totalCount: isEmptyState ? paddedStablecoins.length : categorizedAssets.stablecoins.length,
        onNavigate: onNavigateToCryptoAssets,
        onItemClick,
      },
    ];
  }, [
    isEmptyState,
    categorizedAssets,
    resolvedDefaults,
    onNavigateToCryptoAssets,
    onNavigateToCryptos,
    onItemClick,
    t,
  ]);

  return {
    isLoading: needsPadding
      ? isLoadingAssetsData || isLoadingStablecoinTickers
      : isLoadingStablecoinTickers,
    sections,
  };
}
