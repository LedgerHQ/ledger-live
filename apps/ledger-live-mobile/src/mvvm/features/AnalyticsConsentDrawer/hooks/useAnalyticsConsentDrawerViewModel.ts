import { useCallback, useEffect, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useDispatch, useSelector } from "~/context/hooks";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  analyticsConsentInfoSelector,
  analyticsEnabledSelector,
  hasCompletedOnboardingSelector,
} from "~/reducers/settings";
import {
  setAnalytics,
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setPersonalizedRecommendations,
} from "~/actions/settings";
import { NavigatorName, ScreenName } from "~/const";
import { track, updateIdentify } from "~/analytics";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
  resolveAnalyticsOptInParams,
  type AnalyticsConsentPhase,
} from "@ledgerhq/live-common/analyticsConsent/index";

export const ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE = "Analytics consent drawer";

export const ANALYTICS_CONSENT_DRAWER_FLOW = "analytics_consent";

const drawerClosedPayload = {
  page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
  flow: ANALYTICS_CONSENT_DRAWER_FLOW,
};

export function useAnalyticsConsentDrawerViewModel() {
  const dispatch = useDispatch();
  const navigation = useNavigation<BaseNavigation>();
  const isFocused = useIsFocused();
  const feature = useFeature("analyticsOptIn");
  const { policyVersion, consentValidityDays } = resolveAnalyticsOptInParams(feature);

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);

  const needsUpdatePrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion, policyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate, consentValidityDays);

  const shouldOffer = Boolean(
    feature?.enabled && hasCompletedOnboarding && (needsUpdatePrivacy || needsRenewal),
  );

  const [phase, setPhase] = useState<AnalyticsConsentPhase>("closed");

  const handleCloseDrawer = useCallback(() => {
    setPhase(current => {
      if (current !== "closed") {
        track("drawer_closed", drawerClosedPayload);
      }
      return "closed";
    });
  }, []);

  useEffect(() => {
    if (!isFocused || !shouldOffer) {
      handleCloseDrawer();
      return;
    }
    setPhase(current =>
      resolveAnalyticsConsentPhase(current, needsRenewal, needsUpdatePrivacy, analyticsEnabled),
    );
  }, [
    isFocused,
    shouldOffer,
    needsRenewal,
    needsUpdatePrivacy,
    analyticsEnabled,
    handleCloseDrawer,
    policyVersion,
    consentValidityDays,
  ]);

  const persistConsentCompletion = useCallback(async () => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    await updateIdentify();
  }, [dispatch, policyVersion]);

  const applyOptIn = useCallback(async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_in",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    await persistConsentCompletion();
    handleCloseDrawer();
  }, [dispatch, persistConsentCompletion, handleCloseDrawer, policyVersion]);

  const applyOptOut = useCallback(async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_opt_out",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    await persistConsentCompletion();
    handleCloseDrawer();
  }, [dispatch, handleCloseDrawer, persistConsentCompletion, policyVersion]);

  const onPrivacyGotIt = useCallback(async () => {
    track(
      "button_clicked",
      {
        button: "analytics_consent_privacy_got_it",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
        privacyPolicyVersion: policyVersion,
      },
      true,
    );
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    await updateIdentify();
    handleCloseDrawer();
  }, [dispatch, handleCloseDrawer, policyVersion]);

  const onSetPreferences = useCallback(() => {
    track("button_clicked", {
      button: "analytics_consent_set_preferences",
      page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
    });
    handleCloseDrawer();
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.AnalyticsPreferencesSettings,
      params: { initialTogglesOff: true },
    });
  }, [navigation, handleCloseDrawer]);

  const isDrawerOpen = phase !== "closed";

  return {
    phase,
    isDrawerOpen,
    handleCloseDrawer,
    onPrivacyGotIt,
    applyOptIn,
    applyOptOut,
    onSetPreferences,
  };
}
