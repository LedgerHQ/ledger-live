import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_OPT_IN_SCREEN_B_FLOW,
  ANALYTICS_OPT_IN_SCREEN_B_PAGES,
  ANALYTICS_OPT_IN_SCREEN_B_VARIANT,
} from "../types";

type TrackPayload = {
  button?: string;
  toggle?: string;
  value?: boolean;
  page: string;
};

const basePayload = (page: string): TrackPayload => ({
  page,
});

export const trackAnalyticsOptInScreenBClick = (
  button: string,
  page: keyof typeof ANALYTICS_OPT_IN_SCREEN_B_PAGES,
  shouldWeTrack: boolean,
) => {
  track(
    "button_clicked",
    {
      ...basePayload(ANALYTICS_OPT_IN_SCREEN_B_PAGES[page]),
      button,
      flow: ANALYTICS_OPT_IN_SCREEN_B_FLOW,
      variant: ANALYTICS_OPT_IN_SCREEN_B_VARIANT,
      entryPoint: "Onboarding",
    },
    shouldWeTrack,
  );
};

export const trackAnalyticsOptInScreenBToggle = (
  toggle: string,
  value: boolean,
  shouldWeTrack: boolean,
) => {
  track(
    "toggle_clicked",
    {
      ...basePayload(ANALYTICS_OPT_IN_SCREEN_B_PAGES.preferences),
      toggle,
      value,
      flow: ANALYTICS_OPT_IN_SCREEN_B_FLOW,
      variant: ANALYTICS_OPT_IN_SCREEN_B_VARIANT,
      entryPoint: "Onboarding",
    },
    shouldWeTrack,
  );
};
