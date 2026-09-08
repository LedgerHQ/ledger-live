import React, { useCallback } from "react";
import { CardButton, Stepper } from "@ledgerhq/lumen-ui-rnative";
import type { CardOnboardingWidgetCardViewProps } from "./useCardOnboardingWidgetCardViewModel";

export function CardOnboardingWidgetCardView({
  title,
  completedCount,
  totalCount,
  handleOpenDialog,
}: CardOnboardingWidgetCardViewProps) {
  const StepperIcon = useCallback(
    () => <Stepper currentStep={completedCount} totalSteps={totalCount} />,
    [completedCount, totalCount],
  );

  return (
    <CardButton
      title={title}
      icon={StepperIcon}
      onPress={handleOpenDialog}
      testID="pay-card-onboarding-widget-card"
    />
  );
}
