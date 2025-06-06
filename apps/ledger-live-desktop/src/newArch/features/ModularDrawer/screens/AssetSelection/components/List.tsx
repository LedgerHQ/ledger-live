import React, { useCallback, useEffect } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetList, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { ListWrapper } from "../../../components/ListWrapper";
import { useModularDrawerAnalytics } from "../../../analytics/useModularDrawerAnalytics";
import SkeletonList from "../../../components/SkeletonList";

type SelectAssetProps = {
  assetTypes?: AssetType[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  scrollToTop: boolean;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  onScrolledToTop?: () => void;
};

const CURRENT_PAGE = "Modular Asset Selection";

export const SelectAssetList = ({
  assetTypes,
  assetsToDisplay,
  flow,
  scrollToTop,
  source,
  onAssetSelected,
  onScrolledToTop,
}: SelectAssetProps) => {
  const shouldDisplayLoading = !assetTypes || assetTypes.length === 0;
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
        false,
        true,
      );

      onAssetSelected(selectedAsset);
    },
    [trackModularDrawerEvent, flow, source, assetsToDisplay, onAssetSelected],
  );

  const onVisibleItemsScrollEnd = () => {
    //TODO: Add logic to handle scroll end event on ce we have dedicated API for it
  };

  useEffect(() => {
    if (scrollToTop && onScrolledToTop) {
      onScrolledToTop();
    }
  }, [scrollToTop, onScrolledToTop]);

  if (shouldDisplayLoading) {
    return <SkeletonList />;
  }

  return (
    <ListWrapper>
      <AssetList
        scrollToTop={scrollToTop}
        assets={assetsToDisplay}
        onClick={onClick}
        onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      />
    </ListWrapper>
  );
};
