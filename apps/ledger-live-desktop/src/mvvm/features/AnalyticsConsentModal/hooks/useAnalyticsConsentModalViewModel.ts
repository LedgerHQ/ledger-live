import { useCallback, useEffect, useState } from "react";
import { useMatch, useNavigate } from "react-router";
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
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentModalPhase,
  type AnalyticsConsentModalPhase,
} from "@ledgerhq/live-common/analyticsConsentUtils";

export const ANALYTICS_CONSENT_MODAL_PAGE = "Analytics consent modal";

export const ANALYTICS_CONSENT_FLOW = "analytics_consent";

const modalClosedPayload = {
  page: ANALYTICS_CONSENT_MODAL_PAGE,
  flow: ANALYTICS_CONSENT_FLOW,
};

export function useAnalyticsConsentModalViewModel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const [phase, setPhase] = useState<AnalyticsConsentModalPhase>("closed");

  const handleCloseModal = useCallback(() => {
    setPhase(current => {
      if (current !== "closed") {
        track("drawer_closed", modalClosedPayload);
      }
      return "closed";
    });
  }, []);

  useEffect(() => {
    if (!isPortfolioRouteFocused || !shouldOffer) {
      handleCloseModal();
      return;
    }
    setPhase(current =>
      resolveAnalyticsConsentModalPhase(
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
    handleCloseModal,
  ]);

  const persistConsentCompletion = useCallback(async () => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    await updateIdentify({ force: true });
  }, [dispatch]);

  const applyOptIn = useCallback(async () => {
    track("button_clicked", { button: "analytics_consent_opt_in", page: ANALYTICS_CONSENT_MODAL_PAGE });
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    await persistConsentCompletion();
    handleCloseModal();
  }, [dispatch, persistConsentCompletion, handleCloseModal]);

  const applyOptOut = useCallback(async () => {
    track("button_clicked", { button: "analytics_consent_opt_out", page: ANALYTICS_CONSENT_MODAL_PAGE });
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    await persistConsentCompletion();
    handleCloseModal();
  }, [dispatch, persistConsentCompletion, handleCloseModal]);

  const onPrivacyGotIt = useCallback(async () => {
    track("button_clicked", { button: "analytics_consent_privacy_got_it", page: ANALYTICS_CONSENT_MODAL_PAGE });
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    await updateIdentify({ force: true });
    handleCloseModal();
  }, [dispatch, handleCloseModal]);

  const onSetPreferences = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_set_preferences", page: ANALYTICS_CONSENT_MODAL_PAGE });
    handleCloseModal();
    navigate("/settings/display");
  }, [navigate, handleCloseModal]);

  const isModalOpen = phase !== "closed";

  return {
    phase,
    isModalOpen,
    onPrivacyGotIt,
    applyOptIn,
    applyOptOut,
    onSetPreferences,
  };
}
