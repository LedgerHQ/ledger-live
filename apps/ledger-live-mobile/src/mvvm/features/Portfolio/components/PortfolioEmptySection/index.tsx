import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import PortfolioEmptyState from "~/screens/Portfolio/PortfolioEmptyState";
import { usePortfolioEmptySectionViewModel } from "./usePortfolioEmptySectionViewModel";
import { PortfolioNoFundsContent } from "./PortfolioNoFundsContent";

interface PortfolioEmptySectionProps {
  readonly isLNSUpsellBannerShown: boolean;
  readonly showAssets: boolean;
}

export const PortfolioEmptySection = ({
  isLNSUpsellBannerShown,
  showAssets,
}: PortfolioEmptySectionProps) => {
  const { variant, assets, isAddModalOpened, goToAssets, openAddModal, closeAddModal } =
    usePortfolioEmptySectionViewModel();

  if (variant === "no_accounts") {
    return (
      <>
        <Flex flexDirection="column" mt={30} mx={6}>
          <PortfolioEmptyState openAddAccountModal={openAddModal} />
        </Flex>
        <AddAccountDrawer isOpened={isAddModalOpened} onClose={closeAddModal} doesNotHaveAccount />
      </>
    );
  }

  return (
    <PortfolioNoFundsContent
      assets={assets}
      goToAssets={goToAssets}
      isLNSUpsellBannerShown={isLNSUpsellBannerShown}
      showAssets={showAssets}
    />
  );
};
