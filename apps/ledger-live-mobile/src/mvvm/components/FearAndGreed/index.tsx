import React from "react";
import { useFearAndGreedViewModel } from "./useFearAndGreedViewModel";
import { FearAndGreedView } from "./FearAndGreedView";
import type { FearAndGreedAppearance } from "./types";

type FearAndGreedProps = {
  readonly appearance?: FearAndGreedAppearance;
};

export const FearAndGreed = ({ appearance = "compact" }: FearAndGreedProps) => {
  const viewModel = useFearAndGreedViewModel();
  return <FearAndGreedView {...viewModel} appearance={appearance} />;
};
