import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface AssetsSectionsProps {
  variant: WalletAssetsVariant;
  shouldDisplayAssetSection: boolean;
}

export const AssetsSections: React.FC<AssetsSectionsProps> = ({
  variant,
  shouldDisplayAssetSection,
}) => {
  if (shouldDisplayAssetSection) {
    return (
      <Box lx={{ gap: "s16" }}>
        <PortfolioCryptosSection variant={variant} />
        <PortfolioStablecoinsSection variant={variant} />
      </Box>
    );
  }
  return <PortfolioCryptosSection variant="readOnly" />;
};
