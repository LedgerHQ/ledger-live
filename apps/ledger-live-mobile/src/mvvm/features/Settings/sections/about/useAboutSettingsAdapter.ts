import { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import type { SettingsAboutPort, SettingsAboutRowId } from "@features/flow-settings-about";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { openDebugMenu } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import { useLocalizedTermsUrl } from "~/logic/terms";
import useRatings from "~/logic/ratings";
import getFullAppVersion from "~/logic/version";
import { urls } from "~/utils/urls";

/** The store page the rate row opens, named after the store on each platform. */
const STORE_REVIEW =
  Platform.OS === "ios"
    ? { url: urls.applestoreRate, storeName: "App Store" }
    : { url: urls.playstore, storeName: "Play Store" };

/**
 * The events the legacy About rows send when they are selected. The version row sent none, as it
 * had no press handler, so it is not listed.
 */
const LEGACY_ROW_EVENTS: Partial<Record<SettingsAboutRowId, string>> = {
  terms: "TermsConditionsRow",
};

/**
 * The About section's port on mobile: the app version, the localized terms page, the Debug menu
 * unlock of the legacy Settings and, behind `ratingsPrompt`, the feedback flow and the store
 * review page. The social links come from the package.
 */
export function useAboutSettingsAdapter(): SettingsAboutPort {
  const termsUrl = useLocalizedTermsUrl();
  const dispatch = useDispatch();
  const ratingsPrompt = useFeature("ratingsPrompt");
  const { handleSettingsRateApp } = useRatings();
  const version = getFullAppVersion();
  const showFeedback = ratingsPrompt?.enabled ?? false;

  const unlockDeveloperTools = useCallback(() => {
    dispatch(openDebugMenu());
  }, [dispatch]);

  const onRowSelect = useCallback((rowId: SettingsAboutRowId) => {
    const event = LEGACY_ROW_EVENTS[rowId];
    if (event) track(event);
  }, []);

  return useMemo(
    () => ({
      version,
      termsUrl,
      unlockDeveloperTools,
      ...(showFeedback && { feedback: handleSettingsRateApp, storeReview: STORE_REVIEW }),
      onRowSelect,
    }),
    [version, termsUrl, unlockDeveloperTools, showFeedback, handleSettingsRateApp, onRowSelect],
  );
}
