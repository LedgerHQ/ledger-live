import React from "react";
import CardLandingScreenView from "./CardLandingScreenView";
import { useCardLandingScreenViewModel } from "./useCardLandingScreenViewModel";

export const CardLandingScreen = () => {
  const viewModel = useCardLandingScreenViewModel();
  return <CardLandingScreenView {...viewModel} />;
};
