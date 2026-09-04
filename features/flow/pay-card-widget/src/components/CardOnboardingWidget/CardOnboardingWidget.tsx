import React from "react";
import { CardOnboardingWidgetCard } from "../CardOnboardingWidgetCard/CardOnboardingWidgetCard";
import { CardOnboardingDialog } from "../CardOnboardingDialog/CardOnboardingDialog";
import { useCardOnboardingViewModel } from "./useCardOnboardingViewModel";

export function CardOnboardingWidget() {
  const {
    isOpen,
    steps,
    completedCount,
    totalCount,
    onboardingCompleted,
    hasCompletedOnboarding,
    isLoading,
    isError,
    handleOpen,
    handleClose,
    handleGotIt,
  } = useCardOnboardingViewModel();

  if (isLoading || isError || hasCompletedOnboarding) return null;

  return (
    <>
      <CardOnboardingWidgetCard
        completedCount={completedCount}
        totalCount={totalCount}
        onOpen={handleOpen}
        onboardingCompleted={onboardingCompleted}
      />
      <CardOnboardingDialog
        isOpen={isOpen}
        steps={steps}
        onClose={handleClose}
        onboardingCompleted={onboardingCompleted}
        handleGotIt={handleGotIt}
      />
    </>
  );
}
