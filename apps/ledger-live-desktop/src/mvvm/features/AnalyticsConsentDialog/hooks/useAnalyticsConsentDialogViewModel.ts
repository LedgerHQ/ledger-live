import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  shareAnalyticsSelector,
} from "~/renderer/reducers/settings";
import {
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { track, updateIdentify } from "~/renderer/analytics/segment";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentDialogPhase,
  type AnalyticsConsentDialogPhase,
} from "@ledgerhq/live-common/analyticsConsentUtils";

export const ANALYTICS_CONSENT_DIALOG_PAGE = "Analytics consent dialog";

export const ANALYTICS_CONSENT_FLOW = "analytics_consent";

const dialogClosedPayload = {
  page: ANALYTICS_CONSENT_DIALOG_PAGE,
  flow: ANALYTICS_CONSENT_FLOW,
};

export function useAnalyticsConsentDialogViewModel() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy);
  const portfolioRouteMatch = useMatch({ path: "/", end: true });
  const isPortfolioRouteFocused = Boolean(portfolioRouteMatch);

  const feature = useFeature("analyticsOptIn");

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);

  const needsUpdatePrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate);

  const shouldOffer = Boolean(
    feature?.enabled && hasCompletedOnboarding && (needsUpdatePrivacy || needsRenewal),
  );

  const [phase, setPhase] = useState<AnalyticsConsentDialogPhase>("closed");
  const consentPhaseBeforePreferencesRef = useRef<"consentFresh" | "consentReconfirm">(
    "consentFresh",
  );

  /** Preferences-step form only; Redux settings update on Confirm via `applyPreferences`. */
  const [draftShareAnalytics, setDraftShareAnalytics] = useState(true);
  const [draftSharePersonalized, setDraftSharePersonalized] = useState(true);

  const title =
    phase === "consentReconfirm"
      ? t("analyticsConsentModal.reconfirm.title")
      : phase === "privacy"
        ? t("analyticsConsentModal.privacy.title")
        : t("analyticsConsentModal.fresh.title");

  const descriptionLead =
    phase === "consentReconfirm"
      ? t("analyticsConsentModal.reconfirm.description")
      : phase === "privacy"
        ? null
        : t("analyticsConsentModal.fresh.description");

  const onOpenPrivacyPolicy = useCallback(() => {
    openURL(privacyPolicyUrl);
  }, [privacyPolicyUrl]);

  const handleCloseDialog = useCallback(() => {
    setPhase(current => {
      if (current !== "closed") {
        track("drawer_closed", dialogClosedPayload);
      }
      return "closed";
    });
  }, []);

  useEffect(() => {
    if (!isPortfolioRouteFocused || !shouldOffer) {
      handleCloseDialog();
      return;
    }
    setPhase(current =>
      resolveAnalyticsConsentDialogPhase(
        current,
        needsRenewal,
        needsUpdatePrivacy,
        shareAnalytics,
      ),
    );
  }, [
    isPortfolioRouteFocused,
    shouldOffer,
    needsRenewal,
    needsUpdatePrivacy,
    shareAnalytics,
    handleCloseDialog,
  ]);

  const persistAnalyticsConsentAck = useCallback(async () => {
    dispatch(setAnalyticsConsentInfo());
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    try {
      await updateIdentify({ force: true });
    } catch (error) {
      console.error("Failed to update analytics identify after consent change", error);
    }
  }, [dispatch]);

  const applyOptIn = useCallback(async () => {
    track("button_clicked", {
      button: "analytics_consent_opt_in",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  }, [dispatch, persistAnalyticsConsentAck, handleCloseDialog]);

  const applyOptOut = useCallback(async () => {
    track("button_clicked", {
      button: "analytics_consent_opt_out",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  }, [dispatch, persistAnalyticsConsentAck, handleCloseDialog]);

  const onPrivacyGotIt = useCallback(async () => {
    track("button_clicked", {
      button: "analytics_consent_privacy_got_it",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  }, [handleCloseDialog, persistAnalyticsConsentAck]);

  const onSetPreferences = useCallback(() => {
    track("button_clicked", {
      button: "analytics_consent_set_preferences",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    setDraftShareAnalytics(true);
    setDraftSharePersonalized(true);
    setPhase(current => {
      if (current === "consentFresh" || current === "consentReconfirm") {
        consentPhaseBeforePreferencesRef.current = current;
      }
      return "preferences";
    });
  }, []);

  const onBackFromPreferences = () => setPhase(consentPhaseBeforePreferencesRef.current);

  const applyPreferences = useCallback(async () => {
    track("button_clicked", {
      button: "analytics_consent_preferences_confirm",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    dispatch(setShareAnalytics(draftShareAnalytics));
    dispatch(setSharePersonalizedRecommendations(draftSharePersonalized));
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  }, [
    dispatch,
    draftShareAnalytics,
    draftSharePersonalized,
    persistAnalyticsConsentAck,
    handleCloseDialog,
  ]);

  const isDialogOpen = phase !== "closed";

  return {
    phase,
    isDialogOpen,
    title,
    descriptionLead,
    privacyPolicyUrl,
    onOpenPrivacyPolicy,
    onPrivacyGotIt,
    applyOptIn,
    applyOptOut,
    onSetPreferences,
    onBackFromPreferences,
    draftShareAnalytics,
    draftSharePersonalized,
    setDraftShareAnalytics,
    setDraftSharePersonalized,
    applyPreferences,
  };
}
