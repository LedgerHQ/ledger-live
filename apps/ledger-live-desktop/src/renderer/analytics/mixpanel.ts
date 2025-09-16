import mixpanel from "mixpanel-browser";
import { getEnv } from "@ledgerhq/live-env";

export function initMixpanel(sampling: number = 100) {
  const token = process.env.MIXPANEL_TOKEN;
  if (token) {
    mixpanel.init(token, {
      api_host: getEnv("MIXPANEL_API_HOST"),
      record_sessions_percent: sampling,
    });
  }
}
