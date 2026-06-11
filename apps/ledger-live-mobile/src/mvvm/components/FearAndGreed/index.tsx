import React from "react";
import { useFearAndGreedViewModel } from "./useFearAndGreedViewModel";
import { FearAndGreedView } from "./FearAndGreedView";
import type { FearAndGreedProps } from "./types";

export const FearAndGreed = ({ appearance = "compact", width }: FearAndGreedProps) => {
  const viewModel = useFearAndGreedViewModel();
  return <FearAndGreedView {...viewModel} appearance={appearance} width={width} />;
};
