import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";

interface PortfolioEmptyAssetSectionsProps {
  readonly shouldDisplayAssetSection: boolean;
  readonly isEmptyState?: boolean;
}

export const PortfolioEmptyAssetSections = ({
  shouldDisplayAssetSection,
  isEmptyState = true,
}: PortfolioEmptyAssetSectionsProps) => {
  if (shouldDisplayAssetSection) {
    return (
      <Box lx={{ rowGap: "s24" }}>
        <PortfolioCryptosSection isEmptyState={isEmptyState} />
        <PortfolioStablecoinsSection isEmptyState={isEmptyState} />
      </Box>
    );
  }

  return <PortfolioCryptosSection isReadOnly />;
};
