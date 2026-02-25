import React from "react";
import { useFearAndGreedViewModel } from "./useFearAndGreedViewModel";
import { FearAndGreedView } from "./FearAndGreedView";

export const FearAndGreed = () => {
  const viewModel = useFearAndGreedViewModel();
  return <FearAndGreedView {...viewModel} />;
};
