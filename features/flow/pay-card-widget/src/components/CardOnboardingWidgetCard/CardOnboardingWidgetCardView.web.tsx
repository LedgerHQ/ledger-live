import React, { memo, useCallback } from "react";
import { CardButton, Stepper } from "@ledgerhq/lumen-ui-react";
import type { CardOnboardingWidgetCardViewProps } from "./useCardOnboardingWidgetCardViewModel";

export const CardOnboardingWidgetCardView = memo(function CardOnboardingWidgetCardView({
  title,
  completedCount,
  totalCount,
  handleOpenDialog,
}: CardOnboardingWidgetCardViewProps) {
  const renderStepperIcon = useCallback(
    () => <Stepper currentStep={completedCount} totalSteps={totalCount} />,
    [completedCount, totalCount],
  );

  return <CardButton title={title} icon={renderStepperIcon} onClick={handleOpenDialog} />;
});
