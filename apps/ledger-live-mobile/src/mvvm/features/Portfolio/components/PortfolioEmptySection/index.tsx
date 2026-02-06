import React from "react";
import { usePortfolioEmptySectionViewModel } from "./usePortfolioEmptySectionViewModel";
import { PortfolioNoSignerContent } from "./PortfolioNoSignerContent";
import PortfolioNoAccountsContent from "./PortfolioNoAccountsContent";

interface PortfolioEmptySectionProps {
  readonly isLNSUpsellBannerShown: boolean;
}

export const PortfolioEmptySection = ({ isLNSUpsellBannerShown }: PortfolioEmptySectionProps) => {
  const { hasAccounts, assets, isAddModalOpened, goToAssets, openAddModal, closeAddModal } =
    usePortfolioEmptySectionViewModel();

  if (!hasAccounts) {
    return (
      <PortfolioNoAccountsContent
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        openAddModal={openAddModal}
        closeAddModal={closeAddModal}
        isAddModalOpened={isAddModalOpened}
      />
    );
  }

  return (
    <PortfolioNoSignerContent
      assets={assets}
      goToAssets={goToAssets}
      isLNSUpsellBannerShown={isLNSUpsellBannerShown}
    />
  );
};
