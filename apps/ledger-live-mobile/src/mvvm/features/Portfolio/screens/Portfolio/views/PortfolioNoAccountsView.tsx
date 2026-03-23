import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import TrackScreen from "~/analytics/TrackScreen";
import { PortfolioBannersSection } from "../../../components";
import { PortfolioCryptosSection } from "LLM/features/WalletAssets/components/CryptosSection";
import { PortfolioStablecoinsSection } from "LLM/features/WalletAssets/components/StablecoinsSection";

interface PortfolioNoAccountsViewProps {
  isLNSUpsellBannerShown: boolean;
  shouldDisplayAssetSection: boolean;
  openAddModal: () => void;
}

export const PortfolioNoAccountsView = ({
  isLNSUpsellBannerShown,
  shouldDisplayAssetSection,
  openAddModal,
}: PortfolioNoAccountsViewProps) => {
  const { t } = useTranslation();

  return (
    <Box lx={{ paddingHorizontal: "s16" }}>
      <TrackScreen name="Wallet" accountsLength={0} />
      <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
      <TransferDrawer />
      <PortfolioBannersSection isFirst isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
      <MarketBanner />
      {shouldDisplayAssetSection && (
        <>
          <PortfolioCryptosSection isEmptyState />
          <Box lx={{ marginTop: "s24" }}>
            <PortfolioStablecoinsSection isEmptyState />
          </Box>
        </>
      )}
      <Button
        appearance="gray"
        size="lg"
        lx={{
          width: "full",
          marginTop: "s24",
          marginBottom: "s48",
        }}
        onPress={openAddModal}
        testID="add-account-cta"
      >
        {t("account.emptyState.addCryptoAccount")}
      </Button>
    </Box>
  );
};
