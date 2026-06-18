import { useState, useCallback, useMemo } from "react";
import { resolveAnalyticsOptInParams } from "@ledgerhq/live-common/analyticsConsent/index";
import {
  hasSeenAnalyticsOptInPromptSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
} from "~/renderer/actions/settings";
import { useFeature } from "@features/platform-feature-flags";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { track, updateIdentify } from "~/renderer/analytics/segment";
import { AB_TESTING_VARIANTS } from "../types/variants";

const ANALYTICS_OPT_IN_PROMPT_ENTRY_POINTS = ["Onboarding", "Portfolio"];

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
  const analyticsOptInFlag = useFeature("analyticsOptIn");
  const { policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFlag);
  const shouldWeTrack = isTrackingEnabled || !hasSeenAnalyticsOptInPrompt;

  const dispatch = useDispatch();

  const [isAnalyticsOptInPromptOpened, setIsAnalyticsOptInPromptOpened] = useState<boolean>(false);

  const [nextStep, setNextStep] = useState<(() => void) | null>(null);
  const flow = trackingKeysByFlow?.[entryPoint];

  const variant = AB_TESTING_VARIANTS.A;

  const trackingPolicyUrl = useLocalizedUrl(urls.trackingPolicy);

  const openAnalyticsOptInPrompt = useCallback(
    (routePath: string, callBack: () => void) => {
      setIsAnalyticsOptInPromptOpened(true);
      setNextStep(() => callBack);
    },
    [setIsAnalyticsOptInPromptOpened],
  );

  const isEntryPointIncluded = ANALYTICS_OPT_IN_PROMPT_ENTRY_POINTS.map(entryPointName =>
    entryPointName.toLowerCase(),
  ).includes(entryPoint.toLowerCase());

  const isFlagEnabled = useMemo(
    () =>
      isEntryPointIncluded &&
      (!hasSeenAnalyticsOptInPrompt || entryPoint === EntryPoint.onboarding),
    [hasSeenAnalyticsOptInPrompt, entryPoint, isEntryPointIncluded],
  );

  const onSubmit = async () => {
    setIsAnalyticsOptInPromptOpened(false);
    dispatch(setAnalyticsConsentInfo(policyVersion));
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    try {
      await updateIdentify({ force: true });
    } catch (error) {
      console.error("Failed to update analytics identify", error);
    }
    if (entryPoint === EntryPoint.onboarding) {
      nextStep?.();
      setNextStep(null);
    }
  };

  const analyticsOptInPromptProps = {
    onClose: () => setIsAnalyticsOptInPromptOpened(false),
    isOpened: isAnalyticsOptInPromptOpened,
    entryPoint: entryPoint,
    variant,
  };

  const handleOpenPrivacyPolicy = (page?: string) => {
    openURL(trackingPolicyUrl);
    track(
      "button_clicked",
      {
        button: "Learn more link",
        flow,
        variant,
        page,
      },
      shouldWeTrack,
    );
  };

  return {
    openAnalyticsOptInPrompt,
    setIsAnalyticsOptInPromptOpened,
    onSubmit,
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed: isFlagEnabled,
    flow,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  };
};
