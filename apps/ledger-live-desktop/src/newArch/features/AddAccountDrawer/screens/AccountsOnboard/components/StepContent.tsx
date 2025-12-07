import { Box, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import logger from "~/renderer/logger";
import { OnboardingConfig, StepId, StepProps } from "../types";

interface StepContentProps {
  stepId: StepId;
  stepperProps: StepProps;
  onboardingConfig: OnboardingConfig;
}

export const StepContent = ({ stepId, stepperProps, onboardingConfig }: StepContentProps) => {
  const { t } = useTranslation();
  const StepComponent = onboardingConfig.stepComponents[stepId];

  if (!StepComponent) {
    const errorMessage = `No step component found for stepId: ${stepId}. Available steps: ${Object.keys(onboardingConfig.stepComponents).join(", ")}`;
    logger.error(`[StepContent] ${errorMessage}`);
    return (
      <Box p={4}>
        <Text variant="body" color="error.c100">
          {t("error.componentNotFound", { defaultValue: "An error occurred. Please try again." })}
        </Text>
      </Box>
    );
  }

  try {
    return <StepComponent {...stepperProps} />;
  } catch (err) {
    logger.error(`[StepContent] Error rendering step component for ${stepId}`, err);
    return (
      <Box p={4}>
        <Text variant="body" color="error.c100">
          {t("error.renderingFailed", {
            defaultValue: "Failed to render component. Please try again.",
          })}
        </Text>
      </Box>
    );
  }
};
