import { useCallback, useMemo } from "react";
import {
  applyPrivacyUpdate,
  type PrivacySettingsPort,
  type PrivacySettingsValues,
  type PrivacySideEffects,
  type PrivacyUpdate,
} from "@features/flow-settings-privacy";
import { setAnalytics, setPersonalizedRecommendations, setReportErrors } from "~/actions/settings";
import { updateIdentify } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  analyticsEnabledSelector,
  personalizedRecommendationsEnabledSelector,
  reportErrorsEnabledSelector,
} from "~/reducers/settings";

const refreshAnalyticsIdentity = () => void updateIdentify(undefined, true);

/**
 * The Privacy section's settings port: its values from the legacy store, and its changes as the
 * legacy General rows dispatch them, analytics identity included. Mobile always has separate
 * consents.
 */
export function usePrivacySettingsAdapter(): PrivacySettingsPort {
  const dispatch = useDispatch();
  const bugReports = useSelector(reportErrorsEnabledSelector);
  const analytics = useSelector(analyticsEnabledSelector);
  const personalizedRecommendations = useSelector(personalizedRecommendationsEnabledSelector);

  const values = useMemo<PrivacySettingsValues>(
    () => ({
      bugReports,
      analytics,
      personalizedRecommendations,
      separateAnalyticsConsents: true,
    }),
    [bugReports, analytics, personalizedRecommendations],
  );

  const effects = useMemo<PrivacySideEffects>(
    () => ({
      setBugReports: value => dispatch(setReportErrors(value)),
      setAnalytics: value => {
        dispatch(setAnalytics(value));
        refreshAnalyticsIdentity();
      },
      setPersonalizedRecommendations: value => {
        dispatch(setPersonalizedRecommendations(value));
        refreshAnalyticsIdentity();
      },
      setAnalyticsAndRecommendations: value => {
        dispatch(setAnalytics(value));
        dispatch(setPersonalizedRecommendations(value));
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
