import mixpanel from "mixpanel-browser";
import { getEnv } from "@ledgerhq/live-env";

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

export function getMixpanelDistinctId(): string | undefined {
  try {
    if (!mixpanel || !mixpanel.get_distinct_id) {
      return undefined;
    }
    return mixpanel.get_distinct_id();
  } catch (error) {
    return undefined;
  }
}
