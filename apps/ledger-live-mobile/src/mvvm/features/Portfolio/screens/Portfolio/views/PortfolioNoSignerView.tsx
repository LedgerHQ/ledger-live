import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import { ScreenName, NavigatorName } from "~/const";
import MarketBanner from "LLM/features/MarketBanner";
import TrackScreen from "~/analytics/TrackScreen";
import { TRACKING_LABEL_MAP } from "LLM/components/MainTabBar/constants";
import { PortfolioBannersSection } from "../../../components";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/components/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/components/StablecoinsSection";

interface PortfolioNoSignerViewProps {
  isLNSUpsellBannerShown: boolean;
  shouldDisplayAssetSection: boolean;
  isEmptyState?: boolean;
}

export const PortfolioNoSignerView = ({
  isLNSUpsellBannerShown,
  shouldDisplayAssetSection,
  isEmptyState,
}: PortfolioNoSignerViewProps) => (
  <Box lx={{ paddingHorizontal: "s16" }}>
    <TrackScreen name={TRACKING_LABEL_MAP[NavigatorName.Portfolio]} />
    <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
    <TransferDrawer />
    <PortfolioBannersSection isFirst isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
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
