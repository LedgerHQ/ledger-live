import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioStocksSection } from "LLM/features/WalletAssets/views/StocksSection";
import { PortfolioServicesSection } from "LLM/features/WalletAssets/views/ServicesSection";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface AssetsSectionsProps {
  variant: WalletAssetsVariant;
  shouldDisplayServicesEntryPoints: boolean;
}

export const AssetsSections: React.FC<AssetsSectionsProps> = ({
  variant,
  shouldDisplayServicesEntryPoints,
}) => (
  <Box lx={{ gap: "s16" }}>
    <PortfolioCryptosSection variant={variant} />
    {shouldDisplayServicesEntryPoints && <PortfolioServicesSection />}
    <PortfolioStablecoinsSection variant={variant} />
    <PortfolioStocksSection variant={variant} />
  </Box>
);
