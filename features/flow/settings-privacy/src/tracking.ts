import { track } from "@shared/analytics";
import type { PrivacyToggleRowId } from "./logic/privacyRows";
import type { PrivacyStateEvent } from "./Privacy.types";
import type { PrivacyPlatform, PrivacySettingsValues } from "./types";

type ToggleEvent = Readonly<{ toggle: string; page: string }>;

const TOGGLE_EVENTS: Readonly<
  Record<PrivacyPlatform, Partial<Record<PrivacyToggleRowId, ToggleEvent>>>
> = {
  desktop: {
    appPerformance: { toggle: "Analytics", page: "settings general" },
    personalizedExperience: { toggle: "personalised recommendations", page: "settings general" },
  },
  mobile: {
    appPerformance: { toggle: "Analytics", page: "Page Settings General" },
    personalizedExperience: { toggle: "Recommendations", page: "Page Settings General" },
  },
};

/** Same `toggle_clicked` events as the legacy analytics toggles. The other toggles send none. */
export function trackPrivacyToggle(
  id: PrivacyToggleRowId,
  value: boolean,
  platform: PrivacyPlatform,
): void {
  const toggleEvent = TOGGLE_EVENTS[platform][id];
  if (!toggleEvent) return;
  track(
    "toggle_clicked",
    { toggle: toggleEvent.toggle, enabled: value, page: toggleEvent.page },
    { mandatory: true },
  );
}

/** The events the legacy General screens send each time a Privacy state changes. */
export function getPrivacyStateEvents(
  values: PrivacySettingsValues,
  platform: PrivacyPlatform,
): readonly PrivacyStateEvent[] {
  if (platform === "mobile") {
    return [
      {
        id: "bugReports",
        event: values.bugReports ? "EnableReportBug" : "DisableReportBug",
      },
      {
        id: "personalizedExperience",
        event: values.personalizedRecommendations
          ? "EnablePersonalizedRecommendations"
          : "DisablePersonalizedRecommendations",
      },
    ];
  }

  const bugReportsEvent: PrivacyStateEvent = {
    id: "bugReports",
    event: values.bugReports ? "ReportBugsEnabled" : "ReportBugsDisabled",
  };
  if (values.separateAnalyticsConsents) return [bugReportsEvent];

  const analyticsEnabled = values.analytics && values.personalizedRecommendations;
  return [
    bugReportsEvent,
    {
      id: "analytics",
      event: analyticsEnabled ? "AnalyticsEnabled" : "AnalyticsDisabled",
      mandatory: true,
    },
  ];
}
