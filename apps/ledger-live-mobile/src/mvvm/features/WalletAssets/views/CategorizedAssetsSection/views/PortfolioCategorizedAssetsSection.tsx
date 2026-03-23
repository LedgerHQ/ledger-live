import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/components/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/components/StablecoinsSection";
import { SeeAllAssetsButton } from "LLM/features/WalletAssets/components/SeeAllAssetsButton";

export const PortfolioCategorizedAssetsSection: React.FC = () => (
  <>
    <Box px={6}>
      <PortfolioCryptosSection />
    </Box>
    <Box px={6} pt={6}>
      <PortfolioStablecoinsSection />
    </Box>
    <Box px={6}>
      <SeeAllAssetsButton />
    </Box>
  </>
);
