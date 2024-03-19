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
import { steps } from "LLD/AnalyticsOptInPrompt/const/steps";

interface UseVariantBProps {
  entryPoint: EntryPoint;
  onSubmit?: () => void;
  step: number;
  setStep: (value: number) => void;
}

export const useVariantB = ({ entryPoint, onSubmit, step, setStep }: UseVariantBProps) => {
  const variant = ABTestingVariants.variantB;
  const dispatch = useDispatch();
  const currentTheme = useSelector(themeSelector);
  const { flow, shouldWeTrack, handleOpenPrivacyPolicy } = useAnalyticsOptInPrompt({ entryPoint });

  const goToPersonalizedRecommandations = () => {
    setStep(1);
  };

  const trackAnalyticsClick = (value: boolean) => {
    track(
      "button_clicked",
      {
        button: value ? "Accept Analytics" : "Refuse Analytics",
        variant,
        flow,
        page: steps.variantB.analytics,
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
        page: steps.variantB.recommendation,
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
    if (step === 0) setupAnalytics(true);
    else setupPersonalizedExperience(true);
  };

  const handleRefuseClick = () => {
    if (step === 0) setupAnalytics(false);
    else setupPersonalizedExperience(false);
  };

  const clickOptions = {
    accept: handleAcceptClick,
    refuse: handleRefuseClick,
  };

  return {
    clickOptions,
    currentTheme,
    step,
    setStep,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  };
};
