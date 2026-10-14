import React from "react";
import StepProgress from "~/renderer/components/StepProgress";
import { useSponsoredPollingViewModel } from "./hooks/useSponsoredPollingViewModel";
import { SponsoredPollingScreenView } from "./components/SponsoredPollingScreenView";

export function SponsoredPollingScreen() {
  const { title, waitingLabel, elapsedLabel } = useSponsoredPollingViewModel();

  return (
    <SponsoredPollingScreenView waitingLabel={waitingLabel} elapsedLabel={elapsedLabel}>
      <StepProgress>{title}</StepProgress>
    </SponsoredPollingScreenView>
  );
}
