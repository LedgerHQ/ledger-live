import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Asset } from "~/types/asset";
import AccountsEmptyList from "LLM/components/EmptyList/AccountsEmptyList";
import { SKELETON_LIST_COUNT } from "LLM/constants";
import { ListItemSkeleton } from "../ListItemSkeleton";
import { CryptoAssetList } from "../CryptoAssetList";

interface CryptoContentProps {
  hasNoAccount: boolean;
  isLoading: boolean;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  sourceScreenName: string;
}

export const CryptoContent: React.FC<CryptoContentProps> = ({
  hasNoAccount,
  isLoading,
  assetsToDisplay,
  onItemPress,
  sourceScreenName,
}) => {
  if (hasNoAccount) {
    return <AccountsEmptyList sourceScreenName={sourceScreenName} />;
  }

  if (isLoading || assetsToDisplay.length === 0) {
    return (
      <Box lx={skeletonContainerStyle}>
        {Array.from({ length: SKELETON_LIST_COUNT }, (_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </Box>
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
