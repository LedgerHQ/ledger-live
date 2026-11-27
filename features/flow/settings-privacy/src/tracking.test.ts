import { track } from "@shared/analytics";
import { getPrivacyStateEvents, trackPrivacyPolicyOpen, trackPrivacyToggle } from "./tracking";
import type { PrivacySettingsValues } from "./types";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const values = (overrides: Partial<PrivacySettingsValues> = {}): PrivacySettingsValues => ({
  bugReports: true,
  analytics: true,
  personalizedRecommendations: true,
  separateAnalyticsConsents: true,
  ...overrides,
});

describe("trackPrivacyToggle", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("sends the desktop analytics toggle events as mandatory", () => {
    trackPrivacyToggle("appPerformance", true, "desktop");
    trackPrivacyToggle("personalizedExperience", false, "desktop");

    expect(jest.mocked(track).mock.calls).toEqual([
      [
        "toggle_clicked",
        { toggle: "Analytics", enabled: true, page: "settings general" },
        { mandatory: true },
      ],
      [
        "toggle_clicked",
        { toggle: "personalised recommendations", enabled: false, page: "settings general" },
        { mandatory: true },
      ],
    ]);
  });

  it("sends the mobile analytics toggle events as mandatory", () => {
    trackPrivacyToggle("appPerformance", false, "mobile");
    trackPrivacyToggle("personalizedExperience", true, "mobile");

    expect(jest.mocked(track).mock.calls).toEqual([
      [
        "toggle_clicked",
        { toggle: "Analytics", enabled: false, page: "Page Settings General" },
        { mandatory: true },
      ],
      [
        "toggle_clicked",
        { toggle: "Recommendations", enabled: true, page: "Page Settings General" },
        { mandatory: true },
      ],
    ]);
  });

  it.each(["desktop", "mobile"] as const)(
    "sends nothing for Bug reports and the shared Analytics toggle on %s",
    platform => {
      trackPrivacyToggle("bugReports", true, platform);
      trackPrivacyToggle("analytics", true, platform);

      expect(track).not.toHaveBeenCalled();
    },
  );
});

describe("trackPrivacyPolicyOpen", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("sends the legacy row event on mobile", () => {
    trackPrivacyPolicyOpen("mobile");

    expect(jest.mocked(track).mock.calls).toEqual([["PrivacyPolicyRow"]]);
  });

  it("sends nothing on desktop, where the linking provider tracks the link", () => {
    trackPrivacyPolicyOpen("desktop");

    expect(track).not.toHaveBeenCalled();
  });
});

describe("getPrivacyStateEvents", () => {
  it("names the bug reports state on desktop when consents are separate", () => {
    expect(getPrivacyStateEvents(values({ bugReports: false }), "desktop")).toEqual([
      { id: "bugReports", event: "ReportBugsDisabled" },
    ]);
  });

  it("adds the mandatory Analytics state on desktop when one toggle holds both consents", () => {
    expect(getPrivacyStateEvents(values({ separateAnalyticsConsents: false }), "desktop")).toEqual([
      { id: "bugReports", event: "ReportBugsEnabled" },
      { id: "analytics", event: "AnalyticsEnabled", mandatory: true },
    ]);
    expect(
      getPrivacyStateEvents(
        values({ separateAnalyticsConsents: false, personalizedRecommendations: false }),
        "desktop",
      ),
    ).toContainEqual({ id: "analytics", event: "AnalyticsDisabled", mandatory: true });
  });

  it("names the bug reports and personalized recommendations states on mobile", () => {
    expect(getPrivacyStateEvents(values(), "mobile")).toEqual([
      { id: "bugReports", event: "EnableReportBug" },
      { id: "personalizedExperience", event: "EnablePersonalizedRecommendations" },
    ]);
    expect(
      getPrivacyStateEvents(
        values({ bugReports: false, personalizedRecommendations: false }),
        "mobile",
      ),
    ).toEqual([
      { id: "bugReports", event: "DisableReportBug" },
      { id: "personalizedExperience", event: "DisablePersonalizedRecommendations" },
    ]);
  });
});
