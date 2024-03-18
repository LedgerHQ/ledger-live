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

  const setupAnalytics = (value: boolean) => {
    dispatch(setShareAnalytics(value));
    goToPersonalizedRecommandations();
    trackAnalyticsClick(value);
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

  const setupPersonalizedExperience = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    onSubmit?.();
    trackPersonalizedExperienceClick(value);
  };

  const handleAcceptClick = () => {
    if (currentStep === 0) setupAnalytics(true);
    else setupPersonalizedExperience(true);
  };

  const handleRefuseClick = () => {
    if (currentStep === 0) setupAnalytics(false);
    else setupPersonalizedExperience(false);
  };

  const clickOptions = {
    accept: handleAcceptClick,
    refuse: handleRefuseClick,
  };

  return {
    clickOptions,
    currentTheme,
    currentStep,
    setCurrentStep,
  };
};
