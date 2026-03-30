import React from "react";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  Pressable,
  Stepper,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import type { OnboardingWidgetViewProps } from "./types";

export const OnboardingWidgetView = ({
  currentStep,
  totalSteps,
  stepperLabel,
  onPress,
}: OnboardingWidgetViewProps) => {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress}>
      <ContentBanner>
        <Stepper currentStep={currentStep} totalSteps={totalSteps} label={stepperLabel} />
        <ContentBannerContent>
          <ContentBannerTitle>{t("postOnboarding.widget.title")}</ContentBannerTitle>
          <ContentBannerDescription>{t("postOnboarding.widget.subtitle")}</ContentBannerDescription>
        </ContentBannerContent>
      </ContentBanner>
    </Pressable>
  );
};
