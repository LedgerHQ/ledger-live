import React from "react";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Pressable,
  Stepper,
} from "@ledgerhq/lumen-ui-rnative";
import type { OnboardingWidgetViewProps } from "./types";

export const OnboardingWidgetView = ({
  title,
  subtitle,
  currentStep,
  totalSteps,
  stepperLabel,
  onPress,
}: OnboardingWidgetViewProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    lx={{ width: "full" }}
    style={({ pressed }) => pressed && { opacity: 0.8 }}
  >
    <ContentBanner>
      <Stepper currentStep={currentStep} totalSteps={totalSteps} label={stepperLabel} />
      <ContentBannerContent>
        <ContentBannerTitle>{title}</ContentBannerTitle>
        <ContentBannerDescription>{subtitle}</ContentBannerDescription>
      </ContentBannerContent>
    </ContentBanner>
  </Pressable>
);
