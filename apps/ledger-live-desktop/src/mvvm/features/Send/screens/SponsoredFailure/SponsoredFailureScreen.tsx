import React from "react";
import { SponsoredFailureScreenView } from "./components/SponsoredFailureScreenView";
import { useSponsoredFailureViewModel } from "./hooks/useSponsoredFailureViewModel";

export function SponsoredFailureScreen() {
  const viewModel = useSponsoredFailureViewModel();

  return <SponsoredFailureScreenView {...viewModel} />;
}
