import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Asset } from "~/types/asset";
import { useTranslation } from "~/context/Locale";
import { AssetLoadingState, AssetStatusState } from "LLM/components/AssetListItem";
import { CryptoAssetList } from "../CryptoAssetList";

interface CryptoContentProps {
  isLoading: boolean;
  error: Error | null;
  assetsToDisplay: Asset[];
  onItemPress: (asset: Asset) => void;
  listTestID?: string;
}

export const CryptoContent: React.FC<CryptoContentProps> = ({
  isLoading,
  error,
  assetsToDisplay,
  onItemPress,
  listTestID,
}) => {
  const { t } = useTranslation();

  if (error) {
    return (
      <AssetStatusState
        variant="error"
        message={t("crypto.errorState")}
        testID="crypto-error-state"
      />
    );
  }

  if (isLoading) {
    return (
      <AssetLoadingState skeletonTestID="crypto-list-item-skeleton" lx={skeletonContainerStyle} />
    );
  }

  if (assetsToDisplay.length === 0) {
    return (
      <AssetStatusState
        variant="empty"
        message={t("crypto.emptyState")}
        testID="crypto-empty-state"
      />
    );
  }

  return (
    <Box lx={listContainerStyle}>
      <CryptoAssetList assets={assetsToDisplay} onItemPress={onItemPress} testID={listTestID} />
    </Box>
  );
};

const skeletonContainerStyle: LumenViewStyle = {
  paddingHorizontal: "s16",
};

const listContainerStyle: LumenViewStyle = {
  flex: 1,
};
