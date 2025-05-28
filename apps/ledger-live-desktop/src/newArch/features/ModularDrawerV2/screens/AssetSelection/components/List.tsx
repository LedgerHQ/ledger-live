import React, { useCallback } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetList, AssetType } from "@ledgerhq/react-ui/pre-ldls";
import { track } from "~/renderer/analytics/segment";
import TrackPage from "~/renderer/analytics/TrackPage";
import { Box, Flex } from "@ledgerhq/react-ui/index";
import { Skeleton } from "LLD/components/Skeleton";

type SelectAssetProps = {
  assetTypes?: AssetType[];
  assetsToDisplay: CryptoOrTokenCurrency[];
  source: string;
  flow: string;
  scrollToTop: boolean;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

const CURRENT_PAGE = "Modular Asset Selection";

export const SelectAssetList = ({
  assetTypes,
  assetsToDisplay,
  source,
  flow,
  scrollToTop,
  onAssetSelected,
}: SelectAssetProps) => {
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
    //TODO: Add logic to handle scroll end event on ce we have dedicated API for it
  };

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
    <Box style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <TrackPage category={source} name={CURRENT_PAGE} flow={flow} />
      <Flex
        style={{
          flex: "1",
          overflow: "hidden",
          maxHeight: "100%",
        }}
      >
        <AssetList
          scrollToTop={scrollToTop}
          assets={assetsToDisplay}
          onClick={onClick}
          onVisibleItemsScrollEnd={onVisibleItemsScrollEnd}
        />
      </Flex>
    </Box>
  );
};
