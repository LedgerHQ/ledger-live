import { useState, useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  hasSeenAnalyticsOptInPromptSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "react-redux";
import { setHasSeenAnalyticsOptInPrompt } from "~/renderer/actions/settings";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";

const trackingKeysByFlow: Record<EntryPoint, string> = {
  onboarding: "consent onboarding",
  portfolio: "consent existing users",
};

interface Props {
  entryPoint: EntryPoint;
}

export const useAnalyticsOptInPrompt = ({ entryPoint }: Props) => {
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const isTrackingEnabled = useSelector(trackingEnabledSelector);
  const lldAnalyticsOptInPromptFlag = useFeature("lldAnalyticsOptInPrompt");
  const shouldWeTrack = isTrackingEnabled || !hasSeenAnalyticsOptInPrompt;

  const dispatch = useDispatch();

  const [isAnalitycsOptInPromptOpened, setIsAnalitycsOptInPromptOpened] = useState<boolean>(false);

  const [nextStep, setNextStep] = useState<(() => void) | null>(null);
  const flow = trackingKeysByFlow?.[entryPoint];

  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);

  const openAnalitycsOptInPrompt = useCallback(
    (routePath: string, callBack: () => void) => {
      setIsAnalitycsOptInPromptOpened(true);
      setNextStep(() => callBack);
    },
    [setIsAnalitycsOptInPromptOpened],
  );

  const isEntryPointIncludedInFlagParams = lldAnalyticsOptInPromptFlag?.params?.entryPoints
    .map(s => s.toLowerCase())
    .includes(entryPoint.toLowerCase());

  const isFlagEnabled = useMemo(
    () =>
      isEntryPointIncludedInFlagParams &&
      lldAnalyticsOptInPromptFlag?.enabled &&
      (!hasSeenAnalyticsOptInPrompt || entryPoint === EntryPoint.onboarding),
    [
      lldAnalyticsOptInPromptFlag,
      hasSeenAnalyticsOptInPrompt,
      entryPoint,
      isEntryPointIncludedInFlagParams,
    ],
  );

  const onSubmit = () => {
    setIsAnalitycsOptInPromptOpened(false);
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    if (entryPoint === EntryPoint.onboarding) {
      nextStep?.();
      setNextStep(null);
    }
  };

  const analyticsOptInPromptProps = {
    onClose: () => setIsAnalitycsOptInPromptOpened(false),
    isOpened: isAnalitycsOptInPromptOpened,
    entryPoint: entryPoint,
    variant: getVariant(lldAnalyticsOptInPromptFlag?.params?.variant),
  };

  const handleOpenPrivacyPolicy = (page?: string) => {
    openURL(privacyPolicyUrl);
    track(
      "button_clicked",
      {
        button: "Learn more link",
        flow,
        variant: getVariant(lldAnalyticsOptInPromptFlag?.params?.variant),
        page,
      },
      shouldWeTrack,
    );
  };

  return {
    openAnalitycsOptInPrompt,
    setIsAnalitycsOptInPromptOpened,
    onSubmit,
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed: isFlagEnabled,
    lldAnalyticsOptInPromptFlag,
    flow,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  };
};

export const getVariant = (variant?: ABTestingVariants): ABTestingVariants =>
  variant === ABTestingVariants.variantB ? ABTestingVariants.variantB : ABTestingVariants.variantA;
