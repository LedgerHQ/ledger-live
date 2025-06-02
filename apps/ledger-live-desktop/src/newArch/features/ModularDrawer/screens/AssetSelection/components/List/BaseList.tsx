import React, { useCallback, useEffect } from "react";
import { AssetList, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Flex } from "@ledgerhq/react-ui/index";
import { Skeleton } from "LLD/components/Skeleton";
import { ListWrapper } from "LLD/features/ModularDrawer/components/ListWrapper";
import { SelectAssetProps } from "./types";

const CURRENT_PAGE = "Modular Asset Selection";

type BaseProps = SelectAssetProps & {
  assetTypes?: AssetType[];
};

export function BaseSelectAssetList({
  assetTypes,
  assetsToDisplay,
  source,
  flow,
  scrollToTop,
  onAssetSelected,
  onScrolledToTop,
}: BaseProps) {
  const shouldDisplayLoading = !assetTypes || assetTypes.length === 0;

  const onClick = useCallback(
    (asset: AssetType) => {
      track("asset_clicked", { asset, page: CURRENT_PAGE, flow });
      const selectedAsset = assetsToDisplay.find(({ id }) => id === asset.id);
      if (!selectedAsset) return;
      onAssetSelected(selectedAsset);
    },
    [assetsToDisplay, onAssetSelected, flow],
  );

  const onVisibleItemsScrollEnd = () => {
    //TODO: Add logic to handle scroll end event once we have dedicated API for it
  };

  useEffect(() => {
    if (scrollToTop && onScrolledToTop) {
      onScrolledToTop();
    }
  }, [scrollToTop, onScrolledToTop]);

  if (shouldDisplayLoading) {
    return (
      <Flex flexDirection="column" flex="1 1 auto" overflow="hidden" rowGap="8px">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} barHeight={64} minHeight={64} />
        ))}
      </Flex>
    );
  }

  return (
    <ListWrapper>
      <TrackPage category={source} name={CURRENT_PAGE} flow={flow} />
      <AssetList
        scrollToTop={scrollToTop}
        assets={assetTypes}
        onClick={onClick}
        onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
      />
    </ListWrapper>
  );
}
