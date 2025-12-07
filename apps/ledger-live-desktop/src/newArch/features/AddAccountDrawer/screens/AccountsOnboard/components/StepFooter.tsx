import React from "react";
import logger from "~/renderer/logger";
import { OnboardingConfig, StepId, StepProps } from "../types";

interface StepFooterProps {
  stepId: StepId;
  stepperProps: StepProps;
  onboardingConfig: OnboardingConfig;
}

export const StepFooter = ({ stepId, stepperProps, onboardingConfig }: StepFooterProps) => {
  const FooterComponent = onboardingConfig.footerComponents[stepId];

  if (!FooterComponent) {
    const errorMessage = `No footer component found for stepId: ${stepId}. Available footers: ${Object.keys(onboardingConfig.footerComponents).join(", ")}`;
    logger.error(`[StepFooter] ${errorMessage}`);
    return null;
  }

  try {
    return <FooterComponent {...stepperProps} />;
  } catch (err) {
    logger.error(`[StepFooter] Error rendering footer component for ${stepId}`, err);
    return null;
  }
};
