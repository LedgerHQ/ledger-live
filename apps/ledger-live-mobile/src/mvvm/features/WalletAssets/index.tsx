import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/views/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/views/StablecoinsSection";
import { PortfolioButtonSection } from "LLM/features/WalletAssets/views/ButtonSection";
import { useWalletAssetsViewModel } from "./useWalletAssetsViewModel";

export const WalletAssetsView: React.FC = () => {
  const { hasMore, onPressShowAll, shouldAddBottomPadding } = useWalletAssetsViewModel();
  const { bottom } = useSafeAreaInsets();

  return (
    <Box
      lx={{ paddingHorizontal: "s16" }}
      style={shouldAddBottomPadding ? { paddingBottom: bottom } : undefined}
    >
      <PortfolioCryptosSection />
      <Box lx={{ paddingTop: "s24" }}>
        <PortfolioStablecoinsSection />
      </Box>
      <Box
        lx={{ paddingTop: "s24" }}
        style={shouldAddBottomPadding ? { paddingBottom: 16 } : undefined}
      >
        <PortfolioButtonSection hasMore={hasMore} onPressShowAll={onPressShowAll} />
      </Box>
    </Box>
  );
};
