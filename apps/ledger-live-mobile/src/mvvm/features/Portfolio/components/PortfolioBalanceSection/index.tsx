import React from "react";
import { PortfolioBalanceSectionProps } from "./types";
import { usePortfolioBalanceSectionViewModel } from "./usePortfolioBalanceSectionViewModel";
import { PortfolioBalanceSectionView } from "./PortfolioBalanceSectionView";

export const PortfolioBalanceSection = ({
  showAssets,
  isReadOnlyMode = false,
}: PortfolioBalanceSectionProps) => {
  const vm = usePortfolioBalanceSectionViewModel({ showAssets, isReadOnlyMode });

  return <PortfolioBalanceSectionView {...vm} />;
};
