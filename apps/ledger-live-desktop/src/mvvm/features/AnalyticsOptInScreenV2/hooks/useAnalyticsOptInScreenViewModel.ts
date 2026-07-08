import { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import {
  trackAnalyticsOptInScreenClick,
  trackAnalyticsOptInScreenToggle,
} from "LLD/features/AnalyticsOptInScreenV2/analytics/trackAnalyticsOptInScreen";
import type {
  AnalyticsOptInScreenHostProps,
  AnalyticsOptInScreenStep,
} from "LLD/features/AnalyticsOptInScreenV2/types";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { analyticsOptInPolicyUrlByVariant } from "LLD/features/AnalyticsOptInPrompt/const/policyUrls";

export function useAnalyticsOptInScreenViewModel({
  isOpened = false,
  onClose,
  onSubmit,
  entryPoint,
}: AnalyticsOptInScreenHostProps) {
  const dispatch = useDispatch();
  const trackingPolicyUrl = useLocalizedUrl(analyticsOptInPolicyUrlByVariant.B);
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);
  const { shouldWeTrack } = useAnalyticsOptInPrompt({ entryPoint });

  const [step, setStep] = useState<AnalyticsOptInScreenStep>("main");
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [shareAnalyticsDraft, setShareAnalyticsDraft] = useState(false);
  const [sharePersonalizedDraft, setSharePersonalizedDraft] = useState(false);

  const handleOpenTrackingPolicy = useCallback(() => {
    openURL(trackingPolicyUrl);
    trackAnalyticsOptInScreenClick("Learn more link", "main", shouldWeTrack);
  }, [shouldWeTrack, trackingPolicyUrl]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    openURL(privacyPolicyUrl);
    trackAnalyticsOptInScreenClick("Learn more link", "preferences", shouldWeTrack);
  }, [privacyPolicyUrl, shouldWeTrack]);

  const closeScreen = useCallback(() => {
    setStep("main");
    setIsPreferencesDialogOpen(false);
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
    // Mandatory: user is opting in — always record the click (same as legacy Accept All).
    trackAnalyticsOptInScreenClick("Accept all", "main", true);
    applyConsent(true, true);
  }, [applyConsent]);

  const handleRefuseAll = useCallback(() => {
    trackAnalyticsOptInScreenClick("Refuse all", "main", shouldWeTrack);
    applyConsent(false, false);
  }, [applyConsent, shouldWeTrack]);

  // Previous intentionally records no consent; the user returns to Welcome and the prompt can show again.
  const handlePrevious = useCallback(() => {
    trackAnalyticsOptInScreenClick("Previous", "main", shouldWeTrack);
    closeScreen();
  }, [closeScreen, shouldWeTrack]);

  const handleOpenPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Set preferences", "main", shouldWeTrack);
    setShareAnalyticsDraft(false);
    setSharePersonalizedDraft(false);
    setStep("preferences");
    setIsPreferencesDialogOpen(true);
  }, [shouldWeTrack]);

  const handleBackFromPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Close", "preferences", shouldWeTrack);
    setIsPreferencesDialogOpen(false);
  }, [shouldWeTrack]);

  const handlePreferencesDialogClosed = useCallback(() => {
    setStep("main");
  }, []);

  const setDraftShareAnalytics = useCallback(
    (value: boolean) => {
      setShareAnalyticsDraft(prev => {
        if (prev !== value) {
          trackAnalyticsOptInScreenToggle("Analytics", value, shouldWeTrack);
        }
        return value;
      });
    },
    [shouldWeTrack],
  );

  const setDraftSharePersonalized = useCallback(
    (value: boolean) => {
      setSharePersonalizedDraft(prev => {
        if (prev !== value) {
          trackAnalyticsOptInScreenToggle("Personalised Recommendations", value, shouldWeTrack);
        }
        return value;
      });
    },
    [shouldWeTrack],
  );

  const applyPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Confirm", "preferences", shouldWeTrack);
    applyConsent(shareAnalyticsDraft, sharePersonalizedDraft);
  }, [applyConsent, shareAnalyticsDraft, sharePersonalizedDraft, shouldWeTrack]);

  return {
    isOpened,
    step,
    isPreferencesDialogOpen,
    shouldWeTrack,
    handleAcceptAll,
    handleRefuseAll,
    handlePrevious,
    handleOpenPreferences,
    handleBackFromPreferences,
    handlePreferencesDialogClosed,
    handleOpenTrackingPolicy,
    draftShareAnalytics: shareAnalyticsDraft,
    draftSharePersonalized: sharePersonalizedDraft,
    setDraftShareAnalytics,
    setDraftSharePersonalized,
    applyPreferences,
    privacyPolicyUrl,
    handleOpenPrivacyPolicy,
  };
}

export type AnalyticsOptInScreenViewModel = ReturnType<typeof useAnalyticsOptInScreenViewModel>;
