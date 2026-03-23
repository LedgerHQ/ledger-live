import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import {
  PortfolioAllocationsSection,
  PortfolioAssetsSection,
  PortfolioCategorizedAssetsSection,
  PortfolioCarouselSection,
  PortfolioBannersSection,
  PortfolioOperationsSection,
} from "../../../components";

interface PortfolioMainViewProps {
  shouldDisplayQuickActionCtas: boolean;
  shouldDisplayGraphRework: boolean;
  shouldDisplayMarketBanner: boolean;
  shouldDisplayAssetSection: boolean;
  isAccountListUIEnabled: boolean;
  hideEmptyTokenAccount: boolean;
  isAWalletCardDisplayed: boolean;
  backgroundColor: string;
  isLNSUpsellBannerShown: boolean;
  openAddModal: () => void;
  handleHeightChange: (newHeight: number) => void;
  goToAnalyticsAllocations: () => void;
}

export const PortfolioMainView = ({
  shouldDisplayQuickActionCtas,
  shouldDisplayGraphRework,
  shouldDisplayMarketBanner,
  shouldDisplayAssetSection,
  isAccountListUIEnabled,
  hideEmptyTokenAccount,
  isAWalletCardDisplayed,
  backgroundColor,
  isLNSUpsellBannerShown,
  openAddModal,
  handleHeightChange,
  goToAnalyticsAllocations,
}: PortfolioMainViewProps) => (
  <>
    {shouldDisplayQuickActionCtas && !shouldDisplayGraphRework && (
      <Box px={6} pt={6}>
        <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
        <TransferDrawer />
      </Box>
    )}
    <PortfolioBannersSection isFirst isLNSUpsellBannerShown={isLNSUpsellBannerShown} showAssets />
    {shouldDisplayMarketBanner && (
      <Box px={6} pt={6}>
        <MarketBanner />
      </Box>
    )}
    {shouldDisplayAssetSection ? (
      <PortfolioCategorizedAssetsSection />
    ) : (
      <PortfolioAssetsSection
        isAccountListUIEnabled={isAccountListUIEnabled}
        hideEmptyTokenAccount={hideEmptyTokenAccount}
        openAddModal={openAddModal}
        onHeightChange={handleHeightChange}
      />
    )}
    {isAWalletCardDisplayed && (
      <PortfolioCarouselSection backgroundColor={backgroundColor} />
    )}
    {!shouldDisplayGraphRework && (
      <PortfolioAllocationsSection
        isFirst={!isAWalletCardDisplayed}
        onPress={goToAnalyticsAllocations}
      />
    )}
    <PortfolioOperationsSection />
  </>
);
