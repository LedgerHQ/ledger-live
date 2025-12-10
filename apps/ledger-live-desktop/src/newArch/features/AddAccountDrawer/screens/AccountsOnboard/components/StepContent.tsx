import React from "react";
import { DynamicStepProps, OnboardingConfig, StableStepProps, StepId } from "../types";

interface StepContentProps {
  stepId: StepId;
  stableProps: StableStepProps;
  dynamicProps: DynamicStepProps;
  onboardingConfig: OnboardingConfig;
}

export const StepContent = ({
  stepId,
  stableProps,
  dynamicProps,
  onboardingConfig,
}: StepContentProps) => {
  const StepComponent = onboardingConfig.stepComponents[stepId];

  if (!StepComponent) {
    console.error(`No step component found for stepId: ${stepId}`);
    return null;
  }

  <StepComponent {...stableProps} {...dynamicProps} />;
};
