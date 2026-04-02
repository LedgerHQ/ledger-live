import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
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

const PAGE = "Analytics consent modal";

export function useAnalyticsConsentModalViewModel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const portfolioRouteMatch = useMatch({ path: "/", end: true });
  const isPortfolioRouteFocused = Boolean(portfolioRouteMatch);

  const feature = useFeature("analyticsOptIn");

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const sharePersonalized = useSelector(sharePersonalizedRecommendationsSelector);

  const needsUpdatePrivacy = useMemo(
    () => needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion),
    [consentInfo.privacyPolicyVersion],
  );
  const needsRenewal = useMemo(
    () => needsConsentRenewal(consentInfo.consentDate),
    [consentInfo.consentDate],
  );

  const shouldOffer = Boolean(
    feature?.enabled && hasCompletedOnboarding && (needsUpdatePrivacy || needsRenewal),
  );

  const [phase, setPhase] = useState<AnalyticsConsentModalPhase>("closed");

  useEffect(() => {
    if (!isPortfolioRouteFocused || !shouldOffer) {
      setPhase("closed");
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
  }, [isPortfolioRouteFocused, shouldOffer, needsRenewal, needsUpdatePrivacy, shareAnalytics]);

  const closeModal = useCallback(() => {
    setPhase("closed");
  }, []);

  const persistConsentCompletion = useCallback(() => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    void updateIdentify({ force: true });
  }, [dispatch]);

  const applyOptIn = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_opt_in", page: PAGE });
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    persistConsentCompletion();
    closeModal();
  }, [dispatch, persistConsentCompletion, closeModal]);

  const applyOptOut = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_opt_out", page: PAGE });
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    persistConsentCompletion();
    closeModal();
  }, [dispatch, persistConsentCompletion, closeModal]);

  const onPrivacyGotIt = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_privacy_got_it", page: PAGE });
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    closeModal();
    void updateIdentify({ force: true });
  }, [dispatch, closeModal]);

  const onSetPreferences = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_set_preferences", page: PAGE });
    closeModal();
    navigate("/settings/display");
  }, [navigate, closeModal]);

  const hasTrackedOpenRef = useRef(false);
  useEffect(() => {
    if (phase !== "closed" && isPortfolioRouteFocused && !hasTrackedOpenRef.current) {
      hasTrackedOpenRef.current = true;
      track("modal_opened", { modal: PAGE });
    }
    if (phase === "closed") {
      hasTrackedOpenRef.current = false;
    }
  }, [phase, isPortfolioRouteFocused]);

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
