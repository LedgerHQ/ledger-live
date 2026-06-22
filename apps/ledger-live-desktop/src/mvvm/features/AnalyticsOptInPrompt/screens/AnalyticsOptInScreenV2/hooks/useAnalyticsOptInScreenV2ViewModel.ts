import { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { EntryPoint } from "../../../types/AnalyticsOptInPromptNavigator";
import { useAnalyticsOptInPrompt } from "../../../hooks/useCommonLogic";
import {
  trackAnalyticsOptInScreenBClick,
  trackAnalyticsOptInScreenBToggle,
} from "../analytics/trackAnalyticsOptInScreenB";
import type { AnalyticsOptInScreenV2HostProps, AnalyticsOptInScreenV2Step } from "../types";

export function useAnalyticsOptInScreenV2ViewModel({
  isOpened = false,
  onClose,
  onSubmit,
}: AnalyticsOptInScreenV2HostProps) {
  const dispatch = useDispatch();
  const trackingPolicyUrl = useLocalizedUrl(urls.trackingPolicy);
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);
  const { shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding });

  const [step, setStep] = useState<AnalyticsOptInScreenV2Step>("main");
  const [draftShareAnalytics, setDraftShareAnalyticsState] = useState(false);
  const [draftSharePersonalized, setDraftSharePersonalizedState] = useState(false);

  const handleOpenTrackingPolicy = useCallback(() => {
    openURL(trackingPolicyUrl);
    trackAnalyticsOptInScreenBClick("Learn more link", "main", shouldWeTrack);
  }, [shouldWeTrack, trackingPolicyUrl]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    openURL(privacyPolicyUrl);
    trackAnalyticsOptInScreenBClick("Learn more link", "preferences", shouldWeTrack);
  }, [privacyPolicyUrl, shouldWeTrack]);

  const closeScreen = useCallback(() => {
    setStep("main");
    onClose();
  }, [onClose]);

  const applyConsent = useCallback(
    (shareAnalytics: boolean, sharePersonalized: boolean) => {
      dispatch(setShareAnalytics(shareAnalytics));
      dispatch(setSharePersonalizedRecommendations(sharePersonalized));
      onSubmit?.();
      closeScreen();
    },
    [closeScreen, dispatch, onSubmit],
  );

  const handleAcceptAll = useCallback(() => {
    trackAnalyticsOptInScreenBClick("Accept all", "main", true);
    applyConsent(true, true);
  }, [applyConsent]);

  const handleRefuseAll = useCallback(() => {
    trackAnalyticsOptInScreenBClick("Refuse all", "main", shouldWeTrack);
    applyConsent(false, false);
  }, [applyConsent, shouldWeTrack]);

  const handleOpenPreferences = useCallback(() => {
    trackAnalyticsOptInScreenBClick("Set preferences", "main", shouldWeTrack);
    setDraftShareAnalyticsState(false);
    setDraftSharePersonalizedState(false);
    setStep("preferences");
  }, [shouldWeTrack]);

  const handleBackFromPreferences = useCallback(() => {
    trackAnalyticsOptInScreenBClick("Close", "preferences", shouldWeTrack);
    setStep("main");
  }, [shouldWeTrack]);

  const setDraftShareAnalytics = useCallback(
    (value: boolean) => {
      setDraftShareAnalyticsState(prev => {
        if (prev !== value) {
          trackAnalyticsOptInScreenBToggle("Analytics", value, shouldWeTrack);
        }
        return value;
      });
    },
    [shouldWeTrack],
  );

  const setDraftSharePersonalized = useCallback(
    (value: boolean) => {
      setDraftSharePersonalizedState(prev => {
        if (prev !== value) {
          trackAnalyticsOptInScreenBToggle("Personalised Recommendations", value, shouldWeTrack);
        }
        return value;
      });
    },
    [shouldWeTrack],
  );

  const applyPreferences = useCallback(() => {
    trackAnalyticsOptInScreenBClick("Confirm", "preferences", shouldWeTrack);
    applyConsent(draftShareAnalytics, draftSharePersonalized);
  }, [applyConsent, draftShareAnalytics, draftSharePersonalized, shouldWeTrack]);

  return {
    isOpened,
    step,
    shouldWeTrack,
    handleAcceptAll,
    handleRefuseAll,
    handleOpenPreferences,
    handleBackFromPreferences,
    handleOpenTrackingPolicy,
    draftShareAnalytics,
    draftSharePersonalized,
    setDraftShareAnalytics,
    setDraftSharePersonalized,
    applyPreferences,
    privacyPolicyUrl,
    handleOpenPrivacyPolicy,
  };
}
