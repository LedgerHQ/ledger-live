import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { ScreenName } from "~/const";
import { PortfolioBannersSection } from "../PortfolioBannersSection";
import { CryptoAddressesButton } from "LLM/features/WalletAssets/components/CryptoAddressesButton";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import TrackScreen from "~/analytics/TrackScreen";
import { useTranslation } from "~/context/Locale";
import { PortfolioEmptyAssetSections } from "./PortfolioEmptyAssetSections";

type PortfolioNoAccountsContentProps = {
  readonly isLNSUpsellBannerShown: boolean;
  readonly shouldDisplayAssetSection?: boolean;
  readonly openAddModal: () => void;
  readonly closeAddModal: () => void;
  readonly isAddModalOpened: boolean;
};

const PortfolioNoAccountsContent = ({
  isLNSUpsellBannerShown,
  shouldDisplayAssetSection = false,
  openAddModal,
  closeAddModal,
  isAddModalOpened,
}: PortfolioNoAccountsContentProps) => {
  const { t } = useTranslation();

  return (
    <Box lx={{ paddingHorizontal: "s16" }}>
      <TrackScreen name="Wallet" accountsLength={0} />
      <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
      <TransferDrawer />
      <PortfolioBannersSection isFirst={true} isLNSUpsellBannerShown={isLNSUpsellBannerShown} />
      <MarketBanner />
      <PortfolioEmptyAssetSections shouldDisplayAssetSection={shouldDisplayAssetSection} />
      {shouldDisplayAssetSection ? (
        <Box lx={{ marginTop: "s24", marginBottom: "s48" }}>
          <CryptoAddressesButton />
        </Box>
      ) : (
        <>
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full", marginTop: "s24", marginBottom: "s48" }}
            onPress={openAddModal}
            testID="add-account-cta"
          >
            {t("account.emptyState.addCryptoAccount")}
          </Button>
          <AddAccountDrawer
            isOpened={isAddModalOpened}
            onClose={closeAddModal}
            doesNotHaveAccount
          />
        </>
      )}
    </Box>
  );
};

export default PortfolioNoAccountsContent;
