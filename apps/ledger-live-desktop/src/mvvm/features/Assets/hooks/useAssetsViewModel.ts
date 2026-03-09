import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { AssetsViewProps } from "../types";
import { useSelector } from "LLD/hooks/redux";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useAccountStatus } from "LLD/hooks/useAccountStatus";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { EMPTY_STATE_CRYPTOS, EMPTY_STATE_STABLECOINS, MAX_ITEM_DISPLAYED } from "../constants";

export function useAssetsViewModel(): AssetsViewProps {
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { hasAccount } = useAccountStatus();
  const { categorizedAssets, isLoadingStablecoinTickers } = useCategorizedAssetsFromPortfolio();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // To change with next ticket with right path
  const onNavigate = useCallback(() => {
    navigate("/assets");
  }, [navigate]);

  const onItemClick = useCallback(
    (item: CategorizedAssetItem) => {
      setTrackingSource("asset allocation");
      navigate(`/asset/${item.currency.id}`);
    },
    [navigate],
  );

  const isEmptyState = !hasOnboardedDevice || !hasAccount;

  const sections = useMemo(() => {
    const maxCryptos = isEmptyState ? EMPTY_STATE_CRYPTOS : MAX_ITEM_DISPLAYED;
    const maxStablecoins = isEmptyState ? EMPTY_STATE_STABLECOINS : MAX_ITEM_DISPLAYED;

    return [
      {
        sectionId: "cryptos",
        title: t("assets.cryptos"),
        items: categorizedAssets.cryptos.slice(0, maxCryptos),
        totalCount: categorizedAssets.cryptos.length,
        onNavigate,
        onItemClick,
      },
      {
        sectionId: "stablecoins",
        title: t("assets.stablecoins"),
        items: categorizedAssets.stablecoins.slice(0, maxStablecoins),
        totalCount: categorizedAssets.stablecoins.length,
        onNavigate,
        onItemClick,
      },
    ];
  }, [categorizedAssets, isEmptyState, onNavigate, onItemClick, t]);

  return {
    isLoading: isLoadingStablecoinTickers,
    sections,
  };
}
