import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { ScreenName, NavigatorName } from "~/const";
import { PortfolioCryptosSection } from "../PortfolioCryptosSection";
import { PortfolioBannersSection } from "../PortfolioBannersSection";
import { Asset } from "~/types/asset";
import TrackScreen from "~/analytics/TrackScreen";
import { TRACKING_LABEL_MAP } from "LLM/components/MainTabBar/constants";

interface PortfolioNoSignerContentProps {
  readonly assets: Asset[];
  readonly goToAssets: () => void;
  readonly isLNSUpsellBannerShown: boolean;
}

export const PortfolioNoSignerContent = ({
  assets,
  goToAssets,
  isLNSUpsellBannerShown,
}: PortfolioNoSignerContentProps) => (
  <Box lx={{ paddingHorizontal: "s16" }}>
    <TrackScreen name={TRACKING_LABEL_MAP[NavigatorName.Portfolio]} />
    <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
    <TransferDrawer />
    <PortfolioBannersSection isFirst={true} isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
    <MarketBanner />
    <PortfolioCryptosSection assets={assets} onPressShowAll={goToAssets} />
  </Box>
);
