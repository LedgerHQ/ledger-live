import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import { useWalletAssetsViewModel } from "./useWalletAssetsViewModel";

export const WalletAssetsView: React.FC = () => {
  const { hasMore, onPressShowAll } = useWalletAssetsViewModel();

  return (
    <Box lx={{ paddingHorizontal: "s16" }}>
      <Box>
        <PortfolioCryptosSection />
      </Box>
      <Box lx={{ paddingTop: "s24" }}>
        <PortfolioStablecoinsSection />
      </Box>
      <Box lx={{ paddingTop: "s24" }}>
        <PortfolioButtonSection hasMore={hasMore} onPressShowAll={onPressShowAll} />
      </Box>
    </Box>
  );
};
