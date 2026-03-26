import React from "react";
import { usePortfolioEmptySectionViewModel } from "./usePortfolioEmptySectionViewModel";
import { PortfolioNoSignerContent } from "./PortfolioNoSignerContent";
import PortfolioNoAccountsContent from "./PortfolioNoAccountsContent";

export const PortfolioEmptySection = () => {
  const { hasAccounts } = usePortfolioEmptySectionViewModel();

  if (!hasAccounts) {
    return <PortfolioNoAccountsContent />;
  }

  return <PortfolioNoSignerContent />;
};
