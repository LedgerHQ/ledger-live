import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { PortfolioCryptosSection } from "../../PortfolioCryptosSection";
import { PortfolioStablecoinsSection } from "../../PortfolioStablecoinsSection";
import { SeeAllAssetsButton } from "../../SeeAllAssetsButton";
import { usePortfolioCategorizedAssetsSectionViewModel } from "../usePortfolioCategorizedAssetsSectionViewModel";

export const PortfolioCategorizedAssetsSection: React.FC = () => {
  const { hasMore, onPressShowAll } = usePortfolioCategorizedAssetsSectionViewModel();

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
