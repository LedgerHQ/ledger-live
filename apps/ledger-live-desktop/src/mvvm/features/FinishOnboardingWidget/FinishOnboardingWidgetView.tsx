import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import type { FinishOnboardingWidgetViewProps } from "./useFinishOnboardingWidgetViewModel";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerTitle,
  ContentBannerDescription,
  Stepper,
} from "@ledgerhq/lumen-ui-react";

const FinishOnboardingWidgetView = memo(function FinishOnboardingWidgetView({
  postOnboardingInProgress,
  currentStep,
  totalSteps,
  handleNavigateToPostOnboardingHub,
}: FinishOnboardingWidgetViewProps) {
  const { t } = useTranslation();

  if (!postOnboardingInProgress) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="finish-onboarding-widget"
      onClick={handleNavigateToPostOnboardingHub}
      className="cursor-pointer border-none bg-transparent p-0 text-left w-1/2"
    >
      <ContentBanner>
        <Stepper
          currentStep={currentStep}
          totalSteps={totalSteps}
          label={`${currentStep}/${totalSteps}`}
        />
        <ContentBannerContent>
          <ContentBannerTitle>{t("postOnboarding.widget.title")}</ContentBannerTitle>
          <ContentBannerDescription>{t("postOnboarding.widget.subtitle")}</ContentBannerDescription>
        </ContentBannerContent>
      </ContentBanner>
    </button>
  );
});

export default FinishOnboardingWidgetView;
