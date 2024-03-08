import { useState, useEffect, useCallback } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { hasSeenAnalyticsOptInPromptSelector } from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "react-redux";
import { setHasSeenAnalyticsOptInPrompt } from "~/renderer/actions/settings";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { ABTestingVariants } from "@ledgerhq/types-live";

type Props = {
  entryPoint: EntryPoint;
};

export const useAnalyticsOptInPrompt = ({ entryPoint }: Props) => {
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const lldAnalyticsOptInPromptFlag = useFeature("lldAnalyticsOptInPrompt");

  const dispatch = useDispatch();

  const [isAnalitycsOptInPromptOpened, setIsAnalitycsOptInPromptOpened] = useState<boolean>(false);
  const [isFeatureFlagsAnalyticsPrefDisplayed, setIsFeatureFlagsAnalyticsPrefDisplayed] =
    useState<boolean>(false);

  const [nextStep, setNextStep] = useState<(() => void) | null>(null);

  const openAnalitycsOptInPrompt = useCallback(
    (routePath: string, callBack: () => void) => {
      setIsAnalitycsOptInPromptOpened(true);
      setNextStep(() => callBack);
    },
    [setIsAnalitycsOptInPromptOpened],
  );

  useEffect(() => {
    const isFlagEnabled = lldAnalyticsOptInPromptFlag?.enabled && !hasSeenAnalyticsOptInPrompt;
    setIsFeatureFlagsAnalyticsPrefDisplayed(isFlagEnabled || false);
  }, [lldAnalyticsOptInPromptFlag, hasSeenAnalyticsOptInPrompt, dispatch, entryPoint]);

  const onSubmit = useCallback(() => {
    setIsAnalitycsOptInPromptOpened(false);
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    if (entryPoint === EntryPoint.onboarding) {
      nextStep?.();
      setNextStep(null);
    }
  }, [dispatch, entryPoint, nextStep]);

  const analyticsOptInPromptProps = {
    onClose: () => setIsAnalitycsOptInPromptOpened(false),
    isOpened: isAnalitycsOptInPromptOpened,
    entryPoint: entryPoint,
    variant: lldAnalyticsOptInPromptFlag?.params?.variant,
  };

  return {
    openAnalitycsOptInPrompt,
    setIsAnalitycsOptInPromptOpened,
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
    lldAnalyticsOptInPromptFlag,
    onSubmit,
  };
};

export const getVariant = (variant?: ABTestingVariants): ABTestingVariants =>
  variant ?? ABTestingVariants.variantA;
