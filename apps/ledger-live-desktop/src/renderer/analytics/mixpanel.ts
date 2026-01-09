import mixpanel from "mixpanel-browser";
import { getEnv } from "@ledgerhq/live-env";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSelector } from "LLD/hooks/redux";
import { shareAnalyticsSelector } from "../reducers/settings";
/**
 * ⚠️ FEATURE IN TESTING PHASE ⚠️
 *
 * This session replay feature is currently in testing phase.
 * Your data is not recorded nor visible by our teams.
 *
 * If we decide to push this feature to production, only users who have
 * accepted analytics will have their user journey recorded (not their data).
 */

const PUBLIC_MIXPANEL_TOKEN = "9a6672bcb9778cb9ea6e6ba671690d66";

export function initMixpanel(sampling: number = 100) {
  mixpanel.init(PUBLIC_MIXPANEL_TOKEN, {
    api_host: getEnv("MIXPANEL_API_HOST"),
    record_sessions_percent: sampling,
  });
}

export function useGetMixpanelDistinctId(): string | undefined {
  const mixpanelFF = useFeature("lldSessionReplay");
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  if (mixpanelFF?.enabled && shareAnalytics) {
    return mixpanel.get_distinct_id();
  }
  return undefined;
}
