import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Asset } from "~/types/asset";
import { useTranslation } from "~/context/Locale";
import { AssetEmptyState, AssetErrorState, AssetLoadingState } from "LLM/components/AssetListItem";
import { CryptoAssetList } from "../CryptoAssetList";

interface CryptoContentProps {
  isLoading: boolean;
  error: Error | null;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
}

export const CryptoContent: React.FC<CryptoContentProps> = ({
  isLoading,
  error,
  assetsToDisplay,
  onItemPress,
}) => {
  const { t } = useTranslation();

  if (error) {
    return <AssetErrorState message={t("crypto.errorState")} testID="crypto-error-state" />;
  }

  if (isLoading) {
    return (
      <AssetLoadingState skeletonTestID="crypto-list-item-skeleton" lx={skeletonContainerStyle} />
    );
  }

  if (assetsToDisplay.length === 0) {
    return <AssetEmptyState message={t("crypto.emptyState")} testID="crypto-empty-state" />;
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
