import React from "react";
import FinishOnboardingDialogView from "./FinishOnboardingDialogView";
import useFinishOnboardingDialogViewModel from "./hooks/useFinishOnboardingDialogViewModel";

const FinishOnboardingDialog = () => (
  <FinishOnboardingDialogView {...useFinishOnboardingDialogViewModel()} />
);

export default FinishOnboardingDialog;
