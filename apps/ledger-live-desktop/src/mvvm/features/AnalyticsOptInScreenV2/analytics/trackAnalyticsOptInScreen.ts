import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_OPT_IN_SCREEN_FLOW,
  ANALYTICS_OPT_IN_SCREEN_PAGES,
  ANALYTICS_OPT_IN_SCREEN_VARIANT,
} from "LLD/features/AnalyticsOptInScreenV2/types";

type TrackPayload = {
  button?: string;
  toggle?: string;
  value?: boolean;
  page: string;
};

const basePayload = (page: string): TrackPayload => ({
  page,
});

export const trackAnalyticsOptInScreenClick = (
  button: string,
  page: keyof typeof ANALYTICS_OPT_IN_SCREEN_PAGES,
  shouldWeTrack: boolean,
) => {
  track(
    "button_clicked",
    {
      ...basePayload(ANALYTICS_OPT_IN_SCREEN_PAGES[page]),
      button,
      flow: ANALYTICS_OPT_IN_SCREEN_FLOW,
      variant: ANALYTICS_OPT_IN_SCREEN_VARIANT,
      entryPoint: "Onboarding",
    },
    shouldWeTrack,
  );
};

export const trackAnalyticsOptInScreenToggle = (
  toggle: string,
  value: boolean,
  shouldWeTrack: boolean,
) => {
  track(
    "toggle_clicked",
    {
      ...basePayload(ANALYTICS_OPT_IN_SCREEN_PAGES.preferences),
      toggle,
      value,
      flow: ANALYTICS_OPT_IN_SCREEN_FLOW,
      variant: ANALYTICS_OPT_IN_SCREEN_VARIANT,
      entryPoint: "Onboarding",
    },
    shouldWeTrack,
  );
};
