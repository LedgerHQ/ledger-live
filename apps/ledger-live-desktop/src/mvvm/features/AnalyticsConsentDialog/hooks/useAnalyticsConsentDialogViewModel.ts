import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMatch } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  hasSeenAnalyticsOptInPromptSelector,
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
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
} from "@ledgerhq/live-common/analyticsConsentUtils";
import type { AnalyticsConsentDialogPhase } from "../types";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";

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
  const sharePersonalizedRecommendations = useSelector(sharePersonalizedRecommendationsSelector);
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);

  const needsUpdatePrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate);

  const shouldOffer = Boolean(
    feature?.enabled &&
      hasCompletedOnboarding &&
      (!hasSeenAnalyticsOptInPrompt || needsUpdatePrivacy || needsRenewal),
  );

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
      return resolveAnalyticsConsentPhase(
        current,
        needsRenewal,
        needsUpdatePrivacy,
        hasSeenAnalyticsOptInPrompt,
      );
    });
  }, [
    isPortfolioRouteFocused,
    shouldOffer,
    needsRenewal,
    needsUpdatePrivacy,
    hasSeenAnalyticsOptInPrompt,
  ]);

  const persistAnalyticsConsentAck = async () => {
    dispatch(setAnalyticsConsentInfo());
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    try {
      await updateIdentify({ force: true });
    } catch (error) {
      console.error("Failed to update analytics identify after consent change", error);
    }
  };

  const applyOptIn = async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_in",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      },
      true,
    );
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  };

  const applyOptOut = async () => {
    const isPreviouslyOptedOutCompletely = !shareAnalytics && !sharePersonalizedRecommendations;
    const trackMandatory = !isPreviouslyOptedOutCompletely;
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_out",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      },
      trackMandatory,
    );
    dispatch(setShareAnalytics(false));
    dispatch(setSharePersonalizedRecommendations(false));
    await persistAnalyticsConsentAck();
    handleCloseDialog();
  };

  const onPrivacyGotIt = async () => {
    track("button_clicked", {
      button: "analytics_consent_privacy_got_it",
      page: ANALYTICS_CONSENT_DIALOG_PAGE,
      privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    });
    await persistAnalyticsConsentAck();
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
    const trackMandatory = draftShareAnalytics || draftSharePersonalized;
    track(
      "button_clicked",
      {
        button: "analytics_consent_preferences_confirm",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      },
      trackMandatory,
    );
    dispatch(setShareAnalytics(draftShareAnalytics));
    dispatch(setSharePersonalizedRecommendations(draftSharePersonalized));
    await persistAnalyticsConsentAck();
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
