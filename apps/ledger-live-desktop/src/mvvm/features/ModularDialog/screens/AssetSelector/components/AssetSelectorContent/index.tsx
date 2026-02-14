import React, { useCallback, useEffect, useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType } from "../../../../types";
import { useModularDialogAnalytics } from "../../../../analytics/useModularDialogAnalytics";
import SkeletonList from "../../../../components/SkeletonList";
import { MarketPriceIndicator, MarketPercentIndicator } from "../../../../components/Market";
import createAssetConfigurationHook from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import EmptyList from "../../../../components/EmptyList";
import { balanceItem } from "../../../../components/Balance";
import { useBalanceDeps } from "../../../../hooks/useBalanceDeps";
import { useSelector } from "LLD/hooks/redux";
import { modularDrawerIsDebuggingDuplicatesSelector } from "~/renderer/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { groupCurrenciesByAsset } from "@ledgerhq/live-common/modularDrawer/utils/groupCurrenciesByAsset";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import { AssetVirtualList } from "../AssetVirtualList";
import { ApyIndicator } from "../../../../components/ApyIndicator";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";

export type AssetSelectorContentProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  scrollToTop: boolean;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  providersLoadingStatus: LoadingStatus;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  onScrolledToTop?: () => void;
  loadNext?: () => void;
  assetsSorted?: AssetData[];
};

const CURRENT_PAGE = "Modular Asset Selection";

export const AssetSelectorContent = ({
  assetsToDisplay,
  scrollToTop,
  assetsConfiguration,
  providersLoadingStatus,
  onAssetSelected,
  onScrolledToTop,
  loadNext,
  assetsSorted,
}: AssetSelectorContentProps) => {
  const assetsMap = groupCurrenciesByAsset(assetsSorted || []);

  // Determine APY appearance based on user's region (UK users see grey, others see green)
  const { region } = getParsedSystemDeviceLocale();
  const apyAppearance = getApyAppearance(region);

  // Create a wrapped ApyIndicator with the appearance pre-configured
  const ApyIndicatorWithAppearance = useMemo(
    () =>
      ({ value, type }: { value: number; type: Parameters<typeof ApyIndicator>[0]["type"] }) =>
        <ApyIndicator value={value} type={type} appearance={apyAppearance} />,
    [apyAppearance],
  );

  const assetConfigurationDeps = {
    ApyIndicator: ApyIndicatorWithAppearance,
    MarketPriceIndicator,
    MarketPercentIndicator,
    useBalanceDeps,
    balanceItem,
    assetsMap,
  };
  const isDebuggingDuplicates = useSelector(modularDrawerIsDebuggingDuplicatesSelector);

  const makeAssetConfigurationHook = createAssetConfigurationHook(assetConfigurationDeps);

  const transformAssets = makeAssetConfigurationHook({
    assetsConfiguration,
  });

  const assetsTransformed = transformAssets(assetsToDisplay);
  const formattedAssets = useMemo(() => {
    return assetsTransformed.map(asset => {
      const assetWithNetworks = assetsSorted?.find(c => c.networks[0]?.id === asset.id);

      return {
        ...asset,
        numberOfNetworks: assetWithNetworks?.networks?.length,
        assetId: assetWithNetworks?.asset.metaCurrencyId,
      };
    });
  }, [assetsTransformed, assetsSorted]);

  const isLoading = [LoadingStatus.Pending, LoadingStatus.Idle].includes(providersLoadingStatus);
  const shouldDisplayEmptyState =
    (!assetsTransformed || assetsTransformed.length === 0) && !isLoading;
  const { trackModularDialogEvent } = useModularDialogAnalytics();

  const onClick = useCallback(
    (asset: AssetType) => {
      const selectedAsset = assetsToDisplay.find(({ id }) => id === asset.id);
      if (!selectedAsset) return;

      trackModularDialogEvent(
        "asset_clicked",
        {
          asset: selectedAsset.name,
          page: CURRENT_PAGE,
        },
        {
          formatAssetConfig: true,
          assetsConfig: assetsConfiguration,
        },
      );

      onAssetSelected(selectedAsset);
    },
    [assetsToDisplay, trackModularDialogEvent, assetsConfiguration, onAssetSelected],
  );

  useEffect(() => {
    if (scrollToTop && onScrolledToTop) {
      onScrolledToTop();
    }
  }, [scrollToTop, onScrolledToTop]);

  if (isLoading) {
    return <SkeletonList />;
  }

  if (shouldDisplayEmptyState) {
    return <EmptyList />;
  }

  return (
    <AssetVirtualList
      scrollToTop={scrollToTop}
      assets={formattedAssets}
      onClick={onClick}
      onVisibleItemsScrollEnd={loadNext}
      hasNextPage={!!loadNext}
      isDebuggingDuplicates={isDebuggingDuplicates}
    />
  );
};
