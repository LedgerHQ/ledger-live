import { useCallback, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  applyPrivacyUpdate,
  type PrivacySettingsPort,
  type PrivacySettingsValues,
  type PrivacySideEffects,
  type PrivacyUpdate,
} from "@features/flow-settings-privacy";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  setCrashReporting,
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { updateIdentify } from "~/renderer/analytics/segment";
import {
  crashReportingSelector,
  shareAnalyticsSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";

const refreshAnalyticsIdentity = () => void updateIdentify({ force: true });

/**
 * The Privacy section's part of the settings port: its values from the legacy store, and its
 * changes as the legacy General screen dispatches them, analytics identity included.
 */
export function usePrivacySettingsAdapter(): PrivacySettingsPort {
  const dispatch = useDispatch();
  const bugReports = useSelector(crashReportingSelector);
  const analytics = useSelector(shareAnalyticsSelector);
  const personalizedRecommendations = useSelector(sharePersonalizedRecommendationsSelector);
  const separateAnalyticsConsents = useFeature("lldAnalyticsOptInPrompt")?.enabled ?? false;

  const values = useMemo<PrivacySettingsValues>(
    () => ({ bugReports, analytics, personalizedRecommendations, separateAnalyticsConsents }),
    [bugReports, analytics, personalizedRecommendations, separateAnalyticsConsents],
  );

  const effects = useMemo<PrivacySideEffects>(
    () => ({
      setBugReports: value => dispatch(setCrashReporting(value)),
      setAnalytics: value => {
        dispatch(setShareAnalytics(value));
        refreshAnalyticsIdentity();
      },
      setPersonalizedRecommendations: value => {
        dispatch(setSharePersonalizedRecommendations(value));
        refreshAnalyticsIdentity();
      },
      setAnalyticsAndRecommendations: value => {
        dispatch(setShareAnalytics(value));
        dispatch(setSharePersonalizedRecommendations(value));
        refreshAnalyticsIdentity();
      },
    }),
    [dispatch],
  );

  const setValue = useCallback(
    (update: PrivacyUpdate) => applyPrivacyUpdate(effects, update),
    [effects],
  );

  return useMemo(() => ({ values, setValue }), [values, setValue]);
}
