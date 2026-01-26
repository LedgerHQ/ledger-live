import React from "react";
import { PortfolioBalanceSectionProps } from "./types";
import { usePortfolioBalanceSectionViewModel } from "./usePortfolioBalanceSectionViewModel";
import { PortfolioBalanceSectionView } from "./PortfolioBalanceSectionView";

export const PortfolioBalanceSection = ({
  showAssets,
  isReadOnlyMode = false,
}: PortfolioBalanceSectionProps) => {
  const { state, balance, countervalueChange, unit, isBalanceAvailable } =
    usePortfolioBalanceSectionViewModel({
      showAssets,
      isReadOnlyMode,
    });

  return (
    <PortfolioBalanceSectionView
      state={state}
      balance={balance}
      countervalueChange={countervalueChange}
      unit={unit}
      isBalanceAvailable={isBalanceAvailable}
    />
  );
};
