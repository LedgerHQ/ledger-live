import React from "react";
import { CardView } from "./CardView";
import { useCardViewModel } from "./useCardViewModel";

export const Card = () => {
  const viewModel = useCardViewModel();

  return <CardView viewModel={viewModel} />;
};
