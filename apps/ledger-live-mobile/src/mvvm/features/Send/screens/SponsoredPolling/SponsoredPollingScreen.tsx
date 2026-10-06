import React from "react";
import { SponsoredPollingView } from "./components/SponsoredPollingView";
import { useSponsoredPollingViewModel } from "./hooks/useSponsoredPollingViewModel";

export function SponsoredPollingScreen() {
  return <SponsoredPollingView {...useSponsoredPollingViewModel()} />;
}
