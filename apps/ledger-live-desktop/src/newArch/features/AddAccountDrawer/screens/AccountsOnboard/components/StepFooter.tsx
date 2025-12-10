import React from "react";
import logger from "~/renderer/logger";
import { DynamicStepProps, OnboardingConfig, StableStepProps, StepId } from "../types";

interface StepFooterProps {
  stepId: StepId;
  stableProps: StableStepProps;
  dynamicProps: DynamicStepProps;
  onboardingConfig: OnboardingConfig;
}

export const StepFooter = ({
  stepId,
  stableProps,
  dynamicProps,
  onboardingConfig,
}: StepFooterProps) => {
  const FooterComponent = onboardingConfig.footerComponents[stepId];

  if (!FooterComponent) {
    const errorMessage = `No footer component found for stepId: ${stepId}. Available footers: ${Object.keys(onboardingConfig.footerComponents).join(", ")}`;
    logger.error(`[StepFooter] ${errorMessage}`);
    return null;
  }

  try {
    return <FooterComponent {...stableProps} {...dynamicProps} />;
  } catch (err) {
    logger.error(`[StepFooter] Error rendering footer component for ${stepId}`, err);
    return null;
  }
};
