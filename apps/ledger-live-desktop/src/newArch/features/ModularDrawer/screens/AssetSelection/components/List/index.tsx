import React, { useCallback, useEffect, useMemo } from "react";
import {
  ApyIndicator,
  AssetList,
  AssetType,
  MarketPercentIndicator,
  MarketPriceIndicator,
} from "@ledgerhq/react-ui/pre-ldls";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { ListWrapper } from "LLD/features/ModularDrawer/components/ListWrapper";
import SkeletonList from "LLD/features/ModularDrawer/components/SkeletonList";
import createAssetConfigurationHook from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CurrenciesByProviderId, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import GenericEmptyList from "LLD/components/GenericEmptyList";
import { balanceItem } from "LLD/features/ModularDrawer/components/Balance";
import { useBalanceDeps } from "LLD/features/ModularDrawer/hooks/useBalanceDeps";
import { useSelector } from "react-redux";
import { modularDrawerIsDebuggingDuplicatesSelector } from "~/renderer/reducers/modularDrawer";

export type SelectAssetProps = {
  assetsToDisplay: CryptoOrTokenCurrency[];
  scrollToTop: boolean;
  assetsConfiguration: EnhancedModularDrawerConfiguration["assets"];
  currenciesByProvider: CurrenciesByProviderId[];
  providersLoadingStatus: LoadingStatus;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  onScrolledToTop?: () => void;
  loadNext?: () => void;
};

const CURRENT_PAGE = "Modular Asset Selection";

const TITLE_HEIGHT = 52;
const SEARCH_HEIGHT = 64;
const MARGIN_BOTTOM = TITLE_HEIGHT + SEARCH_HEIGHT;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

export const SelectAssetList = ({
  assetsToDisplay,
  scrollToTop,
  assetsConfiguration,
  currenciesByProvider,
  providersLoadingStatus,
  onAssetSelected,
  onScrolledToTop,
  loadNext,
}: SelectAssetProps) => {
  const assetConfigurationDeps = {
    ApyIndicator,
    MarketPriceIndicator,
    MarketPercentIndicator,
    useBalanceDeps,
    balanceItem,
  };
  const isDebuggingDuplicates = useSelector(modularDrawerIsDebuggingDuplicatesSelector);

  const makeAssetConfigurationHook = createAssetConfigurationHook(assetConfigurationDeps);

  const transformAssets = makeAssetConfigurationHook({
    assetsConfiguration,
    currenciesByProvider,
  });

  const assetsTransformed = transformAssets(assetsToDisplay);
  const formattedAssets = useMemo(() => {
    return assetsTransformed.map(asset => {
      const currencyByProvider = currenciesByProvider.find(
        c => c.currenciesByNetwork[0]?.id === asset.id,
      );
      return {
        ...asset,
        numberOfNetworks: currencyByProvider?.currenciesByNetwork?.length,
        assetId: currencyByProvider?.metaCurrencyId,
      };
    });
  }, [assetsTransformed, currenciesByProvider]);

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
    return <GenericEmptyList />;
  }

  return (
    <ListWrapper data-testid="asset-selector-list-container" customHeight={LIST_HEIGHT}>
      <AssetList
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
