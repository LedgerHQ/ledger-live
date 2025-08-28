import React, { useCallback, useEffect } from "react";
import { AssetList, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { ListWrapper } from "LLD/features/ModularDrawer/components/ListWrapper";
import SkeletonList from "LLD/features/ModularDrawer/components/SkeletonList";
import createAssetConfigurationHook from "../../modules/createAssetConfigurationHook";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import GenericEmptyList from "LLD/components/GenericEmptyList";

export type SelectAssetProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  scrollToTop: boolean;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  currenciesByProvider: CurrenciesByProviderId[];
  providersLoadingStatus: LoadingStatus;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  onScrolledToTop?: () => void;
};

const CURRENT_PAGE = "Modular Asset Selection";

const TITLE_HEIGHT = 52;
const SEARCH_HEIGHT = 64;
const MARGIN_BOTTOM = TITLE_HEIGHT + SEARCH_HEIGHT;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export const SelectAssetList = ({
  assetsToDisplay,
  source,
  flow,
  scrollToTop,
  assetsConfiguration,
  currenciesByProvider,
  providersLoadingStatus,
  onAssetSelected,
  onScrolledToTop,
}: SelectAssetProps) => {
  const transformAssets = createAssetConfigurationHook({
    assetsConfiguration,
    currenciesByProvider,
  });

  const formattedAssets = transformAssets(assetsToDisplay);

  const isLoading = [LoadingStatus.Pending, LoadingStatus.Idle].includes(providersLoadingStatus);
  const shouldDisplayEmptyState = (!formattedAssets || formattedAssets.length === 0) && !isLoading;
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
          flow,
          source,
        },
        {
          formatAssetConfig: true,
          assetsConfig: assetsConfiguration,
        },
      );

      onAssetSelected(selectedAsset);
    },
    [assetsToDisplay, trackModularDrawerEvent, flow, source, assetsConfiguration, onAssetSelected],
  );

  const onVisibleItemsScrollEnd = () => {
    //TODO: Add logic to handle scroll end event once we have dedicated API for it
  };

  useEffect(() => {
    if (scrollToTop && onScrolledToTop) {
      onScrolledToTop();
    }
  }, [scrollToTop, onScrolledToTop]);

  if (isLoading) {
    return <SkeletonList />;
  }

  if (shouldDisplayEmptyState) {
    return <GenericEmptyList />;
  }

  return (
    <ListWrapper data-testid="asset-selector-list-container" customHeight={LIST_HEIGHT}>
      <AssetList
        scrollToTop={scrollToTop}
        assets={formattedAssets}
        onClick={onClick}
        onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      />
    </ListWrapper>
  );
};
