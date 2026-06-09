import React from "react";
import { LedgerRecoverFeatureIntroView } from "./LedgerRecoverFeatureIntroView";
import { useLedgerRecoverFeatureIntroViewModel } from "./useLedgerRecoverFeatureIntroViewModel";

export function LedgerRecoverFeatureIntro() {
  const viewModel = useLedgerRecoverFeatureIntroViewModel();

  if (!viewModel) {
    return null;
  }

  return <LedgerRecoverFeatureIntroView {...viewModel} />;
}
