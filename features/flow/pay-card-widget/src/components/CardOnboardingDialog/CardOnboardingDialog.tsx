import React from "react";
import { CardOnboardingDialogView } from "./CardOnboardingDialogView";
import { useCardOnboardingDialogViewModel } from "./useCardOnboardingDialogViewModel";
import type { CardOnboardingStepWithCopy } from "../CardOnboardingWidget/useOnboardingSteps";

type Props = {
  isOpen: boolean;
  steps: CardOnboardingStepWithCopy[];
  completedCount: number;
  totalCount: number;
  onClose: () => void;
  onboardingCompleted: boolean;
  handleGotIt: () => void;
};

export function CardOnboardingDialog(props: Readonly<Props>) {
  return <CardOnboardingDialogView {...useCardOnboardingDialogViewModel(props)} />;
}
