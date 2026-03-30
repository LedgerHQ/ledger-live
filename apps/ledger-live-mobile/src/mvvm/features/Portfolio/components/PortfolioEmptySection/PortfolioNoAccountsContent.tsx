import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { ScreenName } from "~/const";
import { PortfolioBannersSection } from "../PortfolioBannersSection";
import TrackScreen from "~/analytics/TrackScreen";
import { WalletAssetsView } from "LLM/features/WalletAssets";

type PortfolioNoAccountsContentProps = {
  readonly isLNSUpsellBannerShown: boolean;
};

const PortfolioNoAccountsContent = ({
  isLNSUpsellBannerShown,
}: PortfolioNoAccountsContentProps) => (
  <Box lx={{ paddingHorizontal: "s16" }}>
    <TrackScreen name="Wallet" accountsLength={0} />
    <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
    <TransferDrawer />
    <PortfolioBannersSection isFirst={true} isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
    <MarketBanner />
    <WalletAssetsView variant="emptyState" noPaddingHorizontal />
  </Box>
);

export default PortfolioNoAccountsContent;
