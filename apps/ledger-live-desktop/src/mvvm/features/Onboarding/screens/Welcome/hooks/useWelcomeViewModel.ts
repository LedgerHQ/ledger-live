import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { saveSettings } from "~/renderer/actions/settings";
import { openURL } from "~/renderer/linking";
import {
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
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

export function useWelcomeViewModel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("desktop");

  // URLs
  const urlReborn = useLocalizedUrl(urls.reborn);
  const urlTerms = useLocalizedUrl(urls.terms);
  const urlPrivacyPolicy = useLocalizedUrl(urls.privacyPolicy);

  // URL handlers
  const openReborn = useCallback(() => openURL(urlReborn), [urlReborn]);
  const openTermsAndConditions = useCallback(() => openURL(urlTerms), [urlTerms]);
  const openPrivacyPolicy = useCallback(() => openURL(urlPrivacyPolicy), [urlPrivacyPolicy]);

  // Redux selectors
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const trustchain = useSelector(trustchainSelector);
  const shouldInitiallySelectDevice = useRef(hasCompletedOnboarding && !trustchain);

  // Navigation effect
  useEffect(() => {
    if (!shouldInitiallySelectDevice.current) return;
    if (shouldUseLazyOnboarding && !hasOnboardedDevice) {
      navigate("/");
    } else {
      navigate("/onboarding/select-device");
    }
  }, [navigate, shouldUseLazyOnboarding, hasOnboardedDevice]);

  // Feature flags easter egg state
  const countRef1 = useRef(0);
  const countRef2 = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isFeatureFlagsSettingsButtonDisplayed, setIsFeatureFlagsSettingsButtonDisplayed] =
    useState<boolean>(false);

  // Feature flags easter egg handler
  const handleOpenFeatureFlagsDrawer = useCallback((nb: string) => {
    if (nb === "1") countRef1.current++;
    else if (nb === "2") countRef2.current++;

    if (countRef1.current > 3 && countRef2.current > 5) {
      countRef1.current = 0;
      countRef2.current = 0;
      setIsFeatureFlagsSettingsButtonDisplayed(true);
    }

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      countRef1.current = 0;
      countRef2.current = 0;
    }, 1000);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const accessSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  // Skip onboarding (dev only)
  const skipOnboardingDev = useCallback(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    navigate("/settings");
  }, [dispatch, navigate]);

  const skipOnboarding = useCallback(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    navigate("/");
  }, [dispatch, navigate]);
  // Main navigation handlers
  const handleAcceptTermsAndGetStarted = useCallback(() => {
    acceptTerms();

    if (shouldUseLazyOnboarding) {
      skipOnboarding();
    } else {
      navigate("/onboarding/select-device");
    }
  }, [navigate, shouldUseLazyOnboarding, skipOnboarding]);

  // Analytics opt-in prompt
  const {
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
    openAnalyticsOptInPrompt,
    onSubmit,
  } = useAnalyticsOptInPrompt({
    entryPoint: EntryPoint.onboarding,
  });

  const extendedAnalyticsOptInPromptProps = useMemo(
    () => ({
      ...analyticsOptInPromptProps,
      onSubmit,
    }),
    [analyticsOptInPromptProps, onSubmit],
  );

  // Ledger Sync activation
  const { openDrawer } = useActivationDrawer();

  const setupLedgerSync = useCallback(() => {
    acceptTerms();
    openDrawer();
  }, [openDrawer]);

  // Action handlers with analytics
  const handleGetStarted = useCallback(() => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", handleAcceptTermsAndGetStarted);
    } else {
      handleAcceptTermsAndGetStarted();
    }
  }, [
    isFeatureFlagsAnalyticsPrefDisplayed,
    openAnalyticsOptInPrompt,
    handleAcceptTermsAndGetStarted,
  ]);

  const handleBuyNew = useCallback(() => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", openReborn);
    } else {
      openReborn();
    }
  }, [isFeatureFlagsAnalyticsPrefDisplayed, openAnalyticsOptInPrompt, openReborn]);

  const handleSetupLedgerSync = useCallback(() => {
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", setupLedgerSync);
    } else {
      setupLedgerSync();
    }
  }, [isFeatureFlagsAnalyticsPrefDisplayed, openAnalyticsOptInPrompt, setupLedgerSync]);

  return {
    // Translations
    t,

    // Navigation
    accessSettings,

    // URL handlers
    openTermsAndConditions,
    openPrivacyPolicy,

    // Feature flags easter egg
    isFeatureFlagsSettingsButtonDisplayed,
    handleOpenFeatureFlagsDrawer,

    // Dev utilities
    skipOnboarding: skipOnboardingDev,

    // Action handlers
    handleGetStarted,
    handleBuyNew,
    handleSetupLedgerSync,

    // Analytics opt-in
    isFeatureFlagsAnalyticsPrefDisplayed,
    extendedAnalyticsOptInPromptProps,
  };
}
