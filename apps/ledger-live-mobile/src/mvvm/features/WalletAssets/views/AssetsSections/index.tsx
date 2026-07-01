import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioStocksSection } from "LLM/features/WalletAssets/views/StocksSection";
import { PortfolioBorrowSection } from "LLM/features/WalletAssets/views/BorrowSection";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface AssetsSectionsProps {
  variant: WalletAssetsVariant;
  shouldDisplayAssetSection: boolean;
  shouldDisplayAssetDiscoverability: boolean;
  shouldDisplayBorrowSection: boolean;
  onBorrowPress: () => void;
}

export const AssetsSections: React.FC<AssetsSectionsProps> = ({
  variant,
  shouldDisplayAssetSection,
  shouldDisplayAssetDiscoverability,
  shouldDisplayBorrowSection,
  onBorrowPress,
}) => {
  if (shouldDisplayAssetSection) {
    return (
      <Box lx={{ gap: "s16" }}>
        <PortfolioCryptosSection variant={variant} />
        <PortfolioStablecoinsSection variant={variant} />
        {shouldDisplayAssetDiscoverability && <PortfolioStocksSection variant={variant} />}
        {variant !== "readOnly" && shouldDisplayBorrowSection && (
          <PortfolioBorrowSection onPress={onBorrowPress} />
        )}
      </Box>
    );
  }
  return <PortfolioCryptosSection variant="readOnly" />;
};
