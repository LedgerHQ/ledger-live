import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import { ScreenName, NavigatorName } from "~/const";
import { PortfolioCryptosSection } from "../PortfolioCryptosSection";
import { PortfolioStablecoinsSection } from "../PortfolioStablecoinsSection";
import { PortfolioBannersSection } from "../PortfolioBannersSection";
import MarketBanner from "LLM/features/MarketBanner";
import TrackScreen from "~/analytics/TrackScreen";
import { TRACKING_LABEL_MAP } from "LLM/components/MainTabBar/constants";

interface PortfolioNoSignerContentProps {
  readonly isLNSUpsellBannerShown: boolean;
  readonly shouldDisplayAssetSection?: boolean;
  readonly isEmptyState?: boolean;
}

export const PortfolioNoSignerContent = ({
  isLNSUpsellBannerShown,
  shouldDisplayAssetSection = false,
  isEmptyState,
}: PortfolioNoSignerContentProps) => (
  <Box lx={{ paddingHorizontal: "s16" }}>
    <TrackScreen name={TRACKING_LABEL_MAP[NavigatorName.Portfolio]} />
    <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
    <TransferDrawer />
    <PortfolioBannersSection isFirst={true} isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
    <MarketBanner />
    {shouldDisplayAssetSection ? (
      <>
        <PortfolioCryptosSection isEmptyState={isEmptyState} />
        <Box lx={{ marginTop: "s24" }}>
          <PortfolioStablecoinsSection isEmptyState={isEmptyState} />
        </Box>
      </>
    ) : (
      <PortfolioCryptosSection isReadOnly />
    )}
  </Box>
);
