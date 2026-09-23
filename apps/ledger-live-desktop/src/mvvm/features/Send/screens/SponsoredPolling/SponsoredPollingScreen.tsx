import React from "react";
import StepProgress from "~/renderer/components/StepProgress";
import { useSponsoredPollingViewModel } from "./hooks/useSponsoredPollingViewModel";
import { SponsoredPollingScreenView } from "./components/SponsoredPollingScreenView";

/**
 * Floating SPONSORED_POLLING step: a thin view over the shared Tronify sponsored-send orchestration
 * while it polls for energy delivery (TX-A already signed+submitted by SPONSORED_RENT_SIGNATURE).
 * Starts no orchestration itself -- the polling runs inside useSponsoredSendOrchestration. Navigates
 * away by phase (TRANSFER -> the existing SIGNATURE step, FAILED -> SPONSORED_FAILURE); see
 * useSponsoredPollingViewModel.
 */
export function SponsoredPollingScreen() {
  const { waitingLabel, elapsedLabel } = useSponsoredPollingViewModel();

  return (
    <SponsoredPollingScreenView elapsedLabel={elapsedLabel}>
      <StepProgress>{waitingLabel}</StepProgress>
    </SponsoredPollingScreenView>
  );
}
