import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useStakingSectionViewModel } from "./useStakingSectionViewModel";
import { StakingSectionView } from "./StakingSectionView";

type StakingSectionProps = Readonly<{
  distributionItem: DistributionItem;
  pnlVisible: boolean;
}>;

export function StakingSection({ distributionItem, pnlVisible }: StakingSectionProps) {
  const viewModel = useStakingSectionViewModel(distributionItem);

  if (viewModel.state.type === "hidden") return null;

  return <StakingSectionView {...viewModel} pnlVisible={pnlVisible} />;
}
