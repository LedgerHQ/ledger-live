import React from "react";
import { SponsoredFailureView } from "./components/SponsoredFailureView";
import { useSponsoredFailureViewModel } from "./hooks/useSponsoredFailureViewModel";

export function SponsoredFailureScreen() {
  return <SponsoredFailureView {...useSponsoredFailureViewModel()} />;
}
