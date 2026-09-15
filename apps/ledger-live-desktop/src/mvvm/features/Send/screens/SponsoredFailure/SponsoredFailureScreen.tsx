import React from "react";
import { SponsoredFailureScreenView } from "./components/SponsoredFailureScreenView";
import { useSponsoredFailureViewModel } from "./hooks/useSponsoredFailureViewModel";

/**
 * Floating SPONSORED_FAILURE step: the error/retry screen for the two-signature Tronify sponsored
 * send, parameterized by `state.failureKind` (RENT_PAYMENT, DELIVERY_FAILED, CONTRACT_DATA,
 * TRANSFER). Reached whenever the shared orchestration lands in phase FAILED. Retry calls
 * actions.retry() and this screen navigates by the resulting phase (see
 * useSponsoredFailureViewModel); Cancel closes the whole Send flow.
 */
export function SponsoredFailureScreen() {
  const viewModel = useSponsoredFailureViewModel();

  return <SponsoredFailureScreenView {...viewModel} />;
}
