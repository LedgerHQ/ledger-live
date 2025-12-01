import React, { useCallback, useEffect, useMemo } from "react";
import { ListItem } from "@ledgerhq/ldls-ui-react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerAnalytics } from "LLD/features/ModularDialog/analytics/useModularDrawerAnalytics";
import { ListWrapper } from "LLD/features/ModularDialog/components/ListWrapper";
import SkeletonList from "LLD/features/ModularDialog/components/SkeletonList";
import createAssetConfigurationHook from "@ledgerhq/live-common/modularDrawer/modules/createAssetConfiguration";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import GenericEmptyList from "LLD/components/GenericEmptyList";
import { balanceItem } from "LLD/features/ModularDialog/components/Balance";
import { useBalanceDeps } from "LLD/features/ModularDialog/hooks/useBalanceDeps";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { groupCurrenciesByAsset } from "@ledgerhq/live-common/modularDrawer/utils/groupCurrenciesByAsset";
import {
  ApyIndicator,
  MarketPercentIndicator,
  MarketPriceIndicator,
} from "@ledgerhq/react-ui/pre-ldls";
import CryptoCurrencyIcon from "~/renderer/components/CryptoCurrencyIcon";
import styled from "styled-components";

export type SelectAssetProps = {
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

const TITLE_HEIGHT = 52;
const SEARCH_HEIGHT = 64;
const MARGIN_BOTTOM = TITLE_HEIGHT + SEARCH_HEIGHT;
const LIST_HEIGHT = `calc(100% - ${MARGIN_BOTTOM}px)`;

const ScrollableContainer = styled.div`
  height: ${LIST_HEIGHT};
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  padding: 0 8px;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--colors-content-subdued-default-default);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--colors-content-default-default);
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TrailingContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const SelectAssetList = ({
  assetsToDisplay,
  scrollToTop,
  assetsConfiguration,
  providersLoadingStatus,
  onAssetSelected,
  onScrolledToTop,
  assetsSorted,
}: SelectAssetProps) => {
  const assetsMap = groupCurrenciesByAsset(assetsSorted || []);

  const assetConfigurationDeps = {
    ApyIndicator,
    MarketPriceIndicator,
    MarketPercentIndicator,
    useBalanceDeps,
    balanceItem,
    assetsMap,
  };

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

  const handleAssetClick = useCallback(
    (assetId: string) => {
      const selectedAsset = assetsToDisplay.find(({ id }) => id === assetId);
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
      <ScrollableContainer>
        <ListContainer>
          {formattedAssets.map(asset => {
            const currency = assetsToDisplay.find(({ id }) => id === asset.id);
            if (!currency) return null;

            // Build description
            const descriptionParts: string[] = [];
            if (asset.ticker) {
              descriptionParts.push(asset.ticker);
            }
            if (asset.numberOfNetworks && asset.numberOfNetworks > 1) {
              descriptionParts.push(`${asset.numberOfNetworks} networks`);
            }
            const description = descriptionParts.join(" · ");

            return (
              <ListItem
                key={asset.id}
                title={asset.name || currency.name}
                description={description || currency.ticker}
                leadingContent={
                  <IconWrapper>
                    <CryptoCurrencyIcon currency={currency} size={32} />
                  </IconWrapper>
                }
                trailingContent={<TrailingContent>{asset.rightElement}</TrailingContent>}
                onClick={() => handleAssetClick(asset.id)}
              />
            );
          })}
        </ListContainer>
      </ScrollableContainer>
    </ListWrapper>
  );
};
