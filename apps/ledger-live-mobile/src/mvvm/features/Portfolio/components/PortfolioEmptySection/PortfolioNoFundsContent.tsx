import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { ScreenName } from "~/const";
import { PortfolioCryptosSection } from "../PortfolioCryptosSection";
import { PortfolioBannersSection } from "../PortfolioBannersSection";
import { Asset } from "~/types/asset";

interface PortfolioNoFundsContentProps {
  readonly assets: Asset[];
  readonly goToAssets: () => void;
  readonly isLNSUpsellBannerShown: boolean;
  readonly showAssets: boolean;
}

export const PortfolioNoFundsContent = ({
  assets,
  goToAssets,
  isLNSUpsellBannerShown,
  showAssets,
}: PortfolioNoFundsContentProps) => (
  <>
    <Box lx={{ paddingHorizontal: "s16" }}>
      <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
      <TransferDrawer />
    </Box>
    <PortfolioBannersSection
      isFirst={true}
      isLNSUpsellBannerShown={isLNSUpsellBannerShown}
      showAssets={showAssets}
    />
    <Box lx={{ paddingHorizontal: "s16" }}>
      <MarketBanner />
    </Box>
    <PortfolioCryptosSection assets={assets} onPressShowAll={goToAssets} />
  </>
);
