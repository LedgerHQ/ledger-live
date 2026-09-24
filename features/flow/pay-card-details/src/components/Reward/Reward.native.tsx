import React from "react";
import { RewardView } from "./RewardView.native";
import { useRewardViewModel } from "./useRewardViewModel";
import type { RewardProps } from "./types";

export function Reward(props: RewardProps) {
  const viewModel = useRewardViewModel(props);

  if (!viewModel) return null;

  return <RewardView {...viewModel} />;
}
