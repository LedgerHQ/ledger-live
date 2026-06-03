import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useStakingSectionViewModel } from "./useStakingSectionViewModel";
import { StakingSectionView } from "./StakingSectionView";

type StakingSectionProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function StakingSection({ distributionItem }: StakingSectionProps) {
  const viewModel = useStakingSectionViewModel(distributionItem);

  if (viewModel.state.type === "hidden") return null;

  return <StakingSectionView {...viewModel} />;
}
