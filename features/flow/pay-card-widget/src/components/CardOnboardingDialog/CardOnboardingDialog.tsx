import React from "react";
import { CardOnboardingDialogView } from "./CardOnboardingDialogView";
import { useCardOnboardingDialogViewModel } from "./useCardOnboardingDialogViewModel";
import type { PayCardOnboardingStep } from "@domain/api-card-management";

type Props = {
  isOpen: boolean;
  steps: PayCardOnboardingStep[];
  onClose: () => void;
  onboardingCompleted: boolean;
  handleGotIt: () => void;
};

export function CardOnboardingDialog(props: Readonly<Props>) {
  return <CardOnboardingDialogView {...useCardOnboardingDialogViewModel(props)} />;
}
