import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Asset } from "~/types/asset";
import { AssetLoadingState } from "LLM/components/AssetListItem";
import { CryptoAssetList } from "../CryptoAssetList";

interface CryptoContentProps {
  isLoading: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
}

export const CryptoContent: React.FC<CryptoContentProps> = ({
  isLoading,
  assetsToDisplay,
  onItemPress,
}) => {
  if (isLoading || assetsToDisplay.length === 0) {
    return (
      <AssetLoadingState skeletonTestID="crypto-list-item-skeleton" lx={skeletonContainerStyle} />
    );
  }

  return (
    <Box lx={listContainerStyle}>
      <CryptoAssetList assets={assetsToDisplay} onItemPress={onItemPress} />
    </Box>
  );
};

const skeletonContainerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

const listContainerStyle: LumenViewStyle = {
  flex: 1,
};
