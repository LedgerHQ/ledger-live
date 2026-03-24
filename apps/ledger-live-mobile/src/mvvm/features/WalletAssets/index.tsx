import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { SeeAllAssetsButton } from "LLM/features/WalletAssets/components/SeeAllAssetsButton";
import { useWalletAssetsViewModel } from "./useWalletAssetsViewModel";

export const WalletAssetsView: React.FC = () => {
  const { hasMore, onPressShowAll } = useWalletAssetsViewModel();

  return (
    <>
      <Box px={6}>
        <PortfolioCryptosSection />
      </Box>
      <Box px={6} pt={6}>
        <PortfolioStablecoinsSection />
      </Box>
      <Box px={6}>
        <SeeAllAssetsButton hasMore={hasMore} onPress={onPressShowAll} />
      </Box>
    </>
  );
};
