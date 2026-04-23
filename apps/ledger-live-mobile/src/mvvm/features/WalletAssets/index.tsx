import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { AssetsSections } from "LLM/features/WalletAssets/views/AssetsSections";
import { AssetsButtonSection } from "LLM/features/WalletAssets/views/AssetsButtonSection";
import { useWalletAssetsViewModel } from "./hooks/useWalletAssetsViewModel";
import { WalletAssetsVariant } from "./types";

interface WalletAssetsViewProps {
  variant?: WalletAssetsVariant;
  noPaddingHorizontal?: boolean;
}

export const WalletAssetsView: React.FC<WalletAssetsViewProps> = ({
  variant = "normal",
  noPaddingHorizontal = false,
}) => {
  const { hasMore, onPressShowAll, shouldAddBottomPadding, shouldDisplayAssetSection } =
    useWalletAssetsViewModel();
  const { bottom } = useSafeAreaInsets();

  return (
    <Box
      lx={noPaddingHorizontal ? undefined : { paddingHorizontal: "s16" }}
      style={
        variant !== "readOnly" && shouldAddBottomPadding
          ? { paddingBottom: bottom + 24 }
          : undefined
      }
    >
      <AssetsSections variant={variant} shouldDisplayAssetSection={shouldDisplayAssetSection} />
      <AssetsButtonSection
        variant={variant}
        shouldDisplayAssetSection={shouldDisplayAssetSection}
        hasMore={hasMore}
        onPressShowAll={onPressShowAll}
      />
    </Box>
  );
};
