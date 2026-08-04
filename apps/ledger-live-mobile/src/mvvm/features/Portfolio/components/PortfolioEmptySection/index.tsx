import React from "react";
import { usePortfolioEmptySectionViewModel } from "./usePortfolioEmptySectionViewModel";
import { PortfolioNoSignerContent } from "./PortfolioNoSignerContent";
import PortfolioNoAccountsContent from "./PortfolioNoAccountsContent";

interface PortfolioEmptySectionProps {
  readonly isLNUpsellBannerShown: boolean;
}

export const PortfolioEmptySection = ({ isLNUpsellBannerShown }: PortfolioEmptySectionProps) => {
  const { hasAccounts } = usePortfolioEmptySectionViewModel();

  if (!hasAccounts) {
    return <PortfolioNoAccountsContent isLNUpsellBannerShown={isLNUpsellBannerShown} />;
  }

  return (
    <PortfolioNoSignerContent isLNUpsellBannerShown={isLNUpsellBannerShown} variant="emptyState" />
  );
};
