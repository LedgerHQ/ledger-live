import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused, useNavigation } from "@react-navigation/native";
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
import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  type ConsentDrawerPhase,
} from "./analyticsConsentDrawerLogic";

const PAGE = "Analytics consent drawer";

export function useAnalyticsConsentDrawerViewModel() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const feature = useFeature("analyticsOptIn");

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);

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

  const [phase, setPhase] = useState<ConsentDrawerPhase>("closed");

  useEffect(() => {
    if (!isFocused || !shouldOffer) {
      setPhase("closed");
      return;
    }
    setPhase(current => {
      if (current !== "closed") return current;
      if (needsRenewal) return analyticsEnabled ? "consentReconfirm" : "consentFresh";
      if (needsUpdatePrivacy) return "privacy";
      return "consentFresh";
    });
  }, [isFocused, shouldOffer, needsRenewal, needsUpdatePrivacy, analyticsEnabled]);

  const closeDrawer = useCallback(() => {
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
    updateIdentify();
  }, [dispatch]);

  const applyOptIn = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_opt_in", page: PAGE });
    dispatch(setAnalytics(true));
    dispatch(setPersonalizedRecommendations(true));
    persistConsentCompletion();
    closeDrawer();
  }, [dispatch, persistConsentCompletion, closeDrawer]);

  const applyOptOut = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_opt_out", page: PAGE });
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
    persistConsentCompletion();
    closeDrawer();
  }, [dispatch, persistConsentCompletion, closeDrawer]);

  const onPrivacyGotIt = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_privacy_got_it", page: PAGE });
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    closeDrawer();
    updateIdentify();
  }, [dispatch, closeDrawer]);

  const onSetPreferences = useCallback(() => {
    track("button_clicked", { button: "analytics_consent_set_preferences", page: PAGE });
    closeDrawer();
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.GeneralSettings,
    });
  }, [navigation, closeDrawer]);

  const handleCloseDrawer = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const hasTrackedOpenRef = useRef(false);
  useEffect(() => {
    if (phase !== "closed" && isFocused && !hasTrackedOpenRef.current) {
      hasTrackedOpenRef.current = true;
      track("modal_opened", { modal: PAGE });
    }
    if (phase === "closed") {
      hasTrackedOpenRef.current = false;
    }
  }, [phase, isFocused]);

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
