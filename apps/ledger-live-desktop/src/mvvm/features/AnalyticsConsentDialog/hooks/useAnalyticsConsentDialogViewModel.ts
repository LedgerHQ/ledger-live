import { useEffect, useState } from "react";
import logger from "~/renderer/logger";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
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
  resolveAnalyticsConsentPhase,
  useAnalyticsConsentDecision,
} from "@features/flow-analytics-consent";
import type { AnalyticsConsentDialogPhase } from "../types";

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

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);

  const { isFeatureEnabled, decision, currentPolicyVersion } =
    useAnalyticsConsentDecision(consentInfo);
  // An invalid remote version must not erase the version the user already acknowledged.
  const policyVersion = currentPolicyVersion?.normalized ?? consentInfo.privacyPolicyVersion;

  const shouldOffer = isFeatureEnabled && hasCompletedOnboarding && decision.kind !== "none";

  const [phase, setPhase] = useState<AnalyticsConsentDialogPhase>("closed");
  const [consentPhaseBeforePreferences, setConsentPhaseBeforePreferences] = useState<
    "consentFresh" | "consentReconfirm"
  >("consentFresh");

  /** Preferences-step form only; Redux settings update on Confirm via `applyPreferences`. */
  const [draftShareAnalytics, setDraftShareAnalytics] = useState(false);
  const [draftSharePersonalized, setDraftSharePersonalized] = useState(false);

  let descriptionLead: string | null;
  if (phase === "consentReconfirm") {
    descriptionLead = t("analyticsConsentModal.reconfirm.description");
  } else if (phase === "privacy") {
    descriptionLead = null;
  } else {
    descriptionLead = t("analyticsConsentModal.fresh.description");
  }

  const onOpenPrivacyPolicy = () => {
    openURL(privacyPolicyUrl);
  };

  const handleCloseDialog = () => {
    setPhase(current => {
      if (current !== "closed") {
        track("drawer_closed", dialogClosedPayload);
      }
      return "closed";
    });
  };

  useEffect(() => {
    if (!isPortfolioRouteFocused || !shouldOffer) {
      setPhase(current => {
        if (current !== "closed") {
          track("drawer_closed", dialogClosedPayload);
        }
        return "closed";
      });
      return;
    }
    setPhase(current => {
      if (current === "preferences") return current;
      return resolveAnalyticsConsentPhase(current, decision, shareAnalytics);
    });
  }, [isPortfolioRouteFocused, shouldOffer, decision, shareAnalytics]);

  const persistConsentCompletion = async () => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    try {
      await updateIdentify({ force: true });
    } catch (e) {
      logger.critical(e, "Failed to update analytics identify after consent change");
    }
  };

  const applyOptIn = async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_in",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    await persistConsentCompletion();
    handleCloseDialog();
  };

  const applyOptOut = async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_out",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    await persistConsentCompletion();
    handleCloseDialog();
  };

  const onPrivacyGotIt = async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_privacy_got_it",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: consentInfo.consentDate,
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    try {
      await updateIdentify({ force: true });
    } catch (e) {
      logger.critical(e, "Failed to update analytics identify after privacy acknowledgement");
    }
    handleCloseDialog();
  };

  const onSetPreferences = () => {
    track("button_clicked", {
      button: "analytics_consent_set_preferences",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
    });
    // Default opt-out: preferences screen opens with both toggles off; user opts in per toggle before confirming.
    setDraftShareAnalytics(false);
    setDraftSharePersonalized(false);
    setPhase(current => {
      if (current === "consentFresh" || current === "consentReconfirm") {
        setConsentPhaseBeforePreferences(current);
      }
      return "preferences";
    });
  };

  const onBackFromPreferences = () => setPhase(consentPhaseBeforePreferences);

  const applyPreferences = async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_preferences_confirm",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(setShareAnalytics(draftShareAnalytics));
    dispatch(setSharePersonalizedRecommendations(draftSharePersonalized));
    await persistConsentCompletion();
    handleCloseDialog();
  };

  const isDialogOpen = phase !== "closed";

  return {
    phase,
    isDialogOpen,
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
