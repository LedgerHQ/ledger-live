import { useState, useCallback, useMemo } from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  hasSeenAnalyticsOptInPromptSelector,
  trackingEnabledSelector,
} from "~/renderer/reducers/settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHasSeenAnalyticsOptInPrompt } from "~/renderer/actions/settings";
import { EntryPoint } from "../types/AnalyticsOptInPromptNavigator";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { track, updateIdentify } from "~/renderer/analytics/segment";

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

  const [isAnalyticsOptInPromptOpened, setIsAnalyticsOptInPromptOpened] = useState<boolean>(false);

  const [nextStep, setNextStep] = useState<(() => void) | null>(null);
  const flow = trackingKeysByFlow?.[entryPoint];

  const variant = getVariant(lldAnalyticsOptInPromptFlag?.params?.variant);

  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);
  const trackingPolicyUrl = useLocalizedUrl(urls.trackingPolicy);

  const urlByVariant = {
    [ABTestingVariants.variantA]: trackingPolicyUrl,
    [ABTestingVariants.variantB]: privacyPolicyUrl,
  };

  const openAnalyticsOptInPrompt = useCallback(
    (routePath: string, callBack: () => void) => {
      setIsAnalyticsOptInPromptOpened(true);
      setNextStep(() => callBack);
    },
    [setIsAnalyticsOptInPromptOpened],
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

  const onSubmit = async () => {
    setIsAnalyticsOptInPromptOpened(false);
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
    openURL(urlByVariant[variant]);
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
    lldAnalyticsOptInPromptFlag,
    flow,
    shouldWeTrack,
    handleOpenPrivacyPolicy,
  };
};

export const getVariant = (variant?: ABTestingVariants): ABTestingVariants =>
  variant === ABTestingVariants.variantB ? ABTestingVariants.variantB : ABTestingVariants.variantA;
