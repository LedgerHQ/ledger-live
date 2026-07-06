import { useCallback, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
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

export function useAnalyticsOptInScreenViewModel({
  isOpened = false,
  onClose,
  onSubmit,
}: AnalyticsOptInScreenHostProps) {
  const dispatch = useDispatch();
  const trackingPolicyUrl = useLocalizedUrl(urls.trackingPolicy);
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);

  const [step, setStep] = useState<AnalyticsOptInScreenStep>("main");
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [shareAnalyticsDraft, setShareAnalyticsDraft] = useState(false);
  const [sharePersonalizedDraft, setSharePersonalizedDraft] = useState(false);

  const handleOpenTrackingPolicy = useCallback(() => {
    openURL(trackingPolicyUrl);
    trackAnalyticsOptInScreenClick("Learn more link", "main");
  }, [trackingPolicyUrl]);

  const handleOpenPrivacyPolicy = useCallback(() => {
    openURL(privacyPolicyUrl);
    trackAnalyticsOptInScreenClick("Learn more link", "preferences");
  }, [privacyPolicyUrl]);

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
    trackAnalyticsOptInScreenClick("Accept all", "main");
    applyConsent(true, true);
  }, [applyConsent]);

  const handleRefuseAll = useCallback(() => {
    trackAnalyticsOptInScreenClick("Refuse all", "main");
    applyConsent(false, false);
  }, [applyConsent]);

  // Previous intentionally records no consent; the user returns to Welcome and the prompt can show again.
  const handlePrevious = useCallback(() => {
    trackAnalyticsOptInScreenClick("Previous", "main");
    closeScreen();
  }, [closeScreen]);

  const handleOpenPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Set preferences", "main");
    setShareAnalyticsDraft(false);
    setSharePersonalizedDraft(false);
    setStep("preferences");
    setIsPreferencesDialogOpen(true);
  }, []);

  const handleBackFromPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Close", "preferences");
    setIsPreferencesDialogOpen(false);
  }, []);

  const handlePreferencesDialogClosed = useCallback(() => {
    setStep("main");
  }, []);

  const setDraftShareAnalytics = useCallback((value: boolean) => {
    setShareAnalyticsDraft(prev => {
      if (prev !== value) {
        trackAnalyticsOptInScreenToggle("Analytics", value);
      }
      return value;
    });
  }, []);

  const setDraftSharePersonalized = useCallback((value: boolean) => {
    setSharePersonalizedDraft(prev => {
      if (prev !== value) {
        trackAnalyticsOptInScreenToggle("Personalised Recommendations", value);
      }
      return value;
    });
  }, []);

  const applyPreferences = useCallback(() => {
    trackAnalyticsOptInScreenClick("Confirm", "preferences");
    applyConsent(shareAnalyticsDraft, sharePersonalizedDraft);
  }, [applyConsent, shareAnalyticsDraft, sharePersonalizedDraft]);

  return {
    isOpened,
    step,
    isPreferencesDialogOpen,
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
