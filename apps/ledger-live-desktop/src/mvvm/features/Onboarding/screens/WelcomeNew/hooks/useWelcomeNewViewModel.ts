import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useNavigate } from "react-router";
import { saveSettings } from "~/renderer/actions/settings";
import { openURL } from "~/renderer/linking";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { acceptTerms } from "~/renderer/terms";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

export function useWelcomeNewViewModel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const lldRebornABtest = useFeature("lldRebornABtest");

  // URLs
  const urlBuyNew = useLocalizedUrl(urls.buyNew);
  const urlReborn = useLocalizedUrl(urls.reborn);
  const urlTerms = useLocalizedUrl(urls.terms);
  const urlPrivacyPolicy = useLocalizedUrl(urls.privacyPolicy);

  // URL handlers
  const buyNew = useCallback(() => openURL(urlBuyNew), [urlBuyNew]);
  const openReborn = useCallback(() => openURL(urlReborn), [urlReborn]);
  const openTermsAndConditions = useCallback(() => openURL(urlTerms), [urlTerms]);
  const openPrivacyPolicy = useCallback(() => openURL(urlPrivacyPolicy), [urlPrivacyPolicy]);

  // Redux selectors
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const trustchain = useSelector(trustchainSelector);

  // Navigation effect
  useEffect(() => {
    if (hasCompletedOnboarding && !trustchain) {
      navigate("/onboarding/select-device");
    }
  }, [hasCompletedOnboarding, navigate, trustchain]);

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
  const skipOnboarding = useCallback(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    navigate("/settings");
  }, [dispatch, navigate]);

  // Main navigation handlers
  const handleAcceptTermsAndGetStarted = useCallback(() => {
    acceptTerms();
    navigate("/onboarding/select-device");
  }, [navigate]);

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
  const { openDrawer, closeDrawer } = useActivationDrawer();

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
    const openUrl = lldRebornABtest?.enabled ? openReborn : buyNew;
    if (isFeatureFlagsAnalyticsPrefDisplayed) {
      openAnalyticsOptInPrompt("Onboarding", openUrl);
    } else {
      openUrl();
    }
  }, [
    isFeatureFlagsAnalyticsPrefDisplayed,
    openAnalyticsOptInPrompt,
    buyNew,
    openReborn,
    lldRebornABtest,
  ]);

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
    skipOnboarding,

    // Action handlers
    handleGetStarted,
    handleBuyNew,
    handleSetupLedgerSync,

    // Analytics opt-in
    isFeatureFlagsAnalyticsPrefDisplayed,
    extendedAnalyticsOptInPromptProps,

    // Ledger Sync
    closeDrawer,
  };
}
