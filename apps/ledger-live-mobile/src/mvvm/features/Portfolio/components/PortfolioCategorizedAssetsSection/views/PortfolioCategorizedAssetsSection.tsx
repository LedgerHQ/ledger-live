import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { PortfolioCryptosSection } from "../../PortfolioCryptosSection";
import { PortfolioStablecoinsSection } from "../../PortfolioStablecoinsSection";
import { SeeAllAssetsButton } from "../../SeeAllAssetsButton";
import usePortfolioCryptosSectionViewModel from "../../PortfolioCryptosSection/hooks/usePortfolioCryptosSectionViewModel";
import usePortfolioStablecoinsSectionViewModel from "../../PortfolioStablecoinsSection/usePortfolioStablecoinsSectionViewModel";

export const PortfolioCategorizedAssetsSection: React.FC = () => {
  const { hasMore: cryptosHasMore, onPressShowAll } = usePortfolioCryptosSectionViewModel();
  const { hasMore: stablecoinsHasMore } = usePortfolioStablecoinsSectionViewModel();
  const hasMore = cryptosHasMore || stablecoinsHasMore;

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
