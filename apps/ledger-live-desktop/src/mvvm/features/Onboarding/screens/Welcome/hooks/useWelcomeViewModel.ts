import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  saveSettings,
  setAnalyticsConsentInfo,
  setHasSeenAnalyticsOptInPrompt,
  setLastOnboardedDevice,
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { openURL } from "~/renderer/linking";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  hasOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";
import { acceptTerms } from "~/renderer/terms";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { resolveAnalyticsOptInParams } from "@features/flow-analytics-consent";

const DEV_SKIP_ONBOARDED_DEVICE = {
  deviceId: "dev-skip-onboarding",
  modelId: DeviceModelId.stax,
  wired: false,
};

export function useWelcomeViewModel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("desktop");

  const urlReborn = useLocalizedUrl(urls.reborn);
  const urlTerms = useLocalizedUrl(urls.terms);
  const urlPrivacyPolicy = useLocalizedUrl(urls.privacyPolicy);

  const openReborn = () => openURL(urlReborn);
  const openTermsAndConditions = () => openURL(urlTerms);
  const openPrivacyPolicy = () => openURL(urlPrivacyPolicy);

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsOptInFlag = useFeature("analyticsOptIn");
  const { currentPolicyVersion } = resolveAnalyticsOptInParams(analyticsOptInFlag);
  const policyVersion = currentPolicyVersion?.normalized ?? consentInfo.privacyPolicyVersion;
  const trustchain = useSelector(trustchainSelector);
  const shouldRedirectToDeviceSelection = useRef(hasCompletedOnboarding && !trustchain);

  useEffect(() => {
    if (!shouldRedirectToDeviceSelection.current) return;

    if (shouldUseLazyOnboarding && !hasOnboardedDevice) {
      navigate("/");
      return;
    }

    navigate("/onboarding/select-device");
  }, [navigate, shouldUseLazyOnboarding, hasOnboardedDevice]);

  const logoClickCount = useRef(0);
  const progressClickCount = useRef(0);
  const easterEggResetTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isFeatureFlagsSettingsButtonDisplayed, setIsFeatureFlagsSettingsButtonDisplayed] =
    useState(false);

  const handleOpenFeatureFlagsDrawer = (source: "1" | "2") => {
    if (source === "1") logoClickCount.current++;
    else progressClickCount.current++;

    if (logoClickCount.current > 3 && progressClickCount.current > 5) {
      logoClickCount.current = 0;
      progressClickCount.current = 0;
      setIsFeatureFlagsSettingsButtonDisplayed(true);
    }

    if (easterEggResetTimeout.current) clearTimeout(easterEggResetTimeout.current);
    easterEggResetTimeout.current = setTimeout(() => {
      logoClickCount.current = 0;
      progressClickCount.current = 0;
    }, 1000);
  };

  useEffect(
    () => () => {
      if (easterEggResetTimeout.current) clearTimeout(easterEggResetTimeout.current);
    },
    [],
  );

  const accessSettings = () => {
    navigate("/settings");
  };

  const skipOnboarding = () => {
    acceptTerms();
    dispatch(setShareAnalytics(true));
    dispatch(setSharePersonalizedRecommendations(true));
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    dispatch(setLastOnboardedDevice(DEV_SKIP_ONBOARDED_DEVICE));
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    navigate("/settings");
  };

  const completeOnboarding = () => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    navigate("/");
  };

  const handleAcceptTermsAndGetStarted = () => {
    acceptTerms();
    if (shouldUseLazyOnboarding) {
      completeOnboarding();
    } else {
      navigate("/onboarding/select-device");
    }
  };

  const {
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
    openAnalyticsOptInPrompt,
    onSubmit,
  } = useAnalyticsOptInPrompt({
    entryPoint: EntryPoint.onboarding,
  });

  const extendedAnalyticsOptInPromptProps = {
    ...analyticsOptInPromptProps,
    onSubmit,
  };

  const { openDrawer } = useActivationDrawer();

  const setupLedgerSync = () => {
    acceptTerms();
    openDrawer();
  };

  const handleGetStarted = () => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", handleAcceptTermsAndGetStarted);
    } else {
      handleAcceptTermsAndGetStarted();
    }
  };

  const handleBuyNew = () => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", openReborn);
    } else {
      openReborn();
    }
  };

  const handleSetupLedgerSync = () => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", setupLedgerSync);
    } else {
      setupLedgerSync();
    }
  };

  return {
    t,
    accessSettings,
    openTermsAndConditions,
    openPrivacyPolicy,
    isFeatureFlagsSettingsButtonDisplayed,
    handleOpenFeatureFlagsDrawer,
    skipOnboarding,
    handleGetStarted,
    handleBuyNew,
    handleSetupLedgerSync,
    isFeatureFlagsAnalyticsPrefDisplayed,
    extendedAnalyticsOptInPromptProps,
  };
}
