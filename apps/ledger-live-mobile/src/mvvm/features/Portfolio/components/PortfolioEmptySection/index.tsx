import React from "react";
import { usePortfolioEmptySectionViewModel } from "./usePortfolioEmptySectionViewModel";
import { PortfolioNoSignerContent } from "./PortfolioNoSignerContent";
import PortfolioNoAccountsContent from "./PortfolioNoAccountsContent";

interface PortfolioEmptySectionProps {
  readonly isLNSUpsellBannerShown: boolean;
}

export const PortfolioEmptySection = ({ isLNSUpsellBannerShown }: PortfolioEmptySectionProps) => {
  const { hasAccounts } = usePortfolioEmptySectionViewModel();

  if (!hasAccounts) {
    return <PortfolioNoAccountsContent isLNSUpsellBannerShown={isLNSUpsellBannerShown} />;
  }

  return (
    <PortfolioNoSignerContent
      isLNSUpsellBannerShown={isLNSUpsellBannerShown}
      variant="emptyState"
    />
  );
};
