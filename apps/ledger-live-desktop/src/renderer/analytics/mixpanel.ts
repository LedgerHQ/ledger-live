import mixpanel from "mixpanel-browser";
import { getEnv } from "@ledgerhq/live-env";

const PUBLIC_MIXPANEL_TOKEN = "9a6672bcb9778cb9ea6e6ba671690d66";

export function initMixpanel(sampling: number = 100) {
  mixpanel.init(PUBLIC_MIXPANEL_TOKEN, {
    api_host: getEnv("MIXPANEL_API_HOST"),
    record_sessions_percent: sampling,
  });
}

export function getMixpanelDistinctId(): string | undefined {
  if (!mixpanel || !mixpanel.get_distinct_id) {
    return undefined;
  }
  return mixpanel.get_distinct_id();
}
