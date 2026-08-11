import React from "react";
import { LazyOnboardingTourDrawer } from "../LazyOnboardingTour/LazyOnboardingTourDrawer";
import { useLazyOnboardingTourDrawerViewModel } from "../LazyOnboardingTour/useLazyOnboardingTourDrawerViewModel";

export function LazyOnboardingTourPortfolioMount() {
  const viewModel = useLazyOnboardingTourDrawerViewModel();

  if (!viewModel) {
    return null;
  }

  return <LazyOnboardingTourDrawer {...viewModel} />;
}
