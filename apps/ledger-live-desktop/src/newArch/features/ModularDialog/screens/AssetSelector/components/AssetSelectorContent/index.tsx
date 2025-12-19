import React, { useCallback, useEffect, useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetType } from "../../../../types";
import { useModularDrawerAnalytics } from "../../../../analytics/useModularDrawerAnalytics";
import { ListWrapper } from "../../../../components/ListWrapper";
import SkeletonList from "../../../../components/SkeletonList";
import { MarketPriceIndicator, MarketPercentIndicator } from "../../../../components/Market";
import createAssetConfigurationHook from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import EmptyList from "../../../../components/EmptyList";
import { balanceItem } from "../../../../components/Balance";
import { useBalanceDeps } from "../../../../hooks/useBalanceDeps";
import { useSelector } from "react-redux";
import { modularDrawerIsDebuggingDuplicatesSelector } from "~/renderer/reducers/modularDrawer";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { groupCurrenciesByAsset } from "@ledgerhq/live-common/modularDrawer/utils/groupCurrenciesByAsset";
import { AssetVirtualList } from "../AssetVirtualList";
import { ApyIndicator } from "../../../../components/ApyIndicator";

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

  const assetConfigurationDeps = {
    ApyIndicator,
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
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const onClick = useCallback(
    (asset: AssetType) => {
      const selectedAsset = assetsToDisplay.find(({ id }) => id === asset.id);
      if (!selectedAsset) return;

      trackModularDrawerEvent(
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
    [assetsToDisplay, trackModularDrawerEvent, assetsConfiguration, onAssetSelected],
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
    return (
      <ListWrapper>
        <EmptyList />
      </ListWrapper>
    );
  }

  return (
    <ListWrapper data-testid="asset-selector-list-container">
      <AssetVirtualList
        scrollToTop={scrollToTop}
        assets={formattedAssets}
        onClick={onClick}
        onVisibleItemsScrollEnd={loadNext}
        hasNextPage={!!loadNext}
        isDebuggingDuplicates={isDebuggingDuplicates}
      />
    </ListWrapper>
  );
};
