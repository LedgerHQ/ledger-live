import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { themeSelector } from "~/renderer/actions/general";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { track } from "~/renderer/analytics/segment";
import { useAnalyticsOptInPrompt } from "./useCommonLogic";
import { ABTestingVariants } from "@ledgerhq/types-live";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";

interface UseVariantBProps {
  goBackToMain: boolean;
  entryPoint: EntryPoint;
  onSubmit?: () => void;
  setPreventBackNavigation: (value: boolean) => void;
}

export const useVariantB = ({
  goBackToMain,
  entryPoint,
  onSubmit,
  setPreventBackNavigation,
}: UseVariantBProps) => {
  const variant = ABTestingVariants.variantB;
  const dispatch = useDispatch();
  const currentTheme = useSelector(themeSelector);
  const [currentStep, setCurrentStep] = useState(0);
  const { flow, shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint });

  useEffect(() => {
    if (goBackToMain) {
      setCurrentStep(0);
    }
  }, [goBackToMain]);

  const goToPersonalizedRecommandations = () => {
    setCurrentStep(1);
    setPreventBackNavigation(true);
  };

  const trackAnalyticsClick = (value: boolean) => {
    track(
      "button_clicked",
      {
        button: value ? "Accept Analytics" : "Refuse Analytics",
        variant,
        flow,
        page: "Analytics Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };

  const clickOnAcceptAnalytics = () => {
    dispatch(setShareAnalytics(true));
    goToPersonalizedRecommandations();
    trackAnalyticsClick(true);
  };

  const clickOnRefuseAnalytics = () => {
    dispatch(setShareAnalytics(false));
    goToPersonalizedRecommandations();
    trackAnalyticsClick(false);
  };

  const trackPersonalizedExperienceClick = (value: boolean) => {
    track(
      "button_clicked",
      {
        button: value ? "Accept Personal Recommendations" : "Refuse Personal Recommendations",
        variant,
        flow,
        page: "Recommendations Opt In Prompt Main",
      },
      shouldWeTrack,
    );
  };

  const clickOnAcceptPersonalizedExperience = () => {
    dispatch(setSharePersonalizedRecommendations(true));
    onSubmit?.();
    trackPersonalizedExperienceClick(true);
  };

  const clickOnRefusePersonalizedExperience = () => {
    dispatch(setSharePersonalizedRecommendations(false));
    onSubmit?.();
    trackPersonalizedExperienceClick(false);
  };

  const clickOptions = {
    acceptAnalytics: clickOnAcceptAnalytics,
    refuseAnalytics: clickOnRefuseAnalytics,
    acceptPersonalizedExp: clickOnAcceptPersonalizedExperience,
    refusePersonalizedExp: clickOnRefusePersonalizedExperience,
  };

  return {
    currentTheme,
    currentStep,
    setCurrentStep,
    clickOptions,
  };
};
