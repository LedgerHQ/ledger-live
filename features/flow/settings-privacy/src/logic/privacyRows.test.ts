import type { PrivacySettingsValues } from "../types";
import { getPrivacyRowIds, getPrivacyToggleValue, toPrivacyUpdate } from "./privacyRows";

const values = (overrides: Partial<PrivacySettingsValues> = {}): PrivacySettingsValues => ({
  bugReports: false,
  analytics: false,
  personalizedRecommendations: false,
  separateAnalyticsConsents: true,
  ...overrides,
});

describe("getPrivacyRowIds", () => {
  it("gives App performance and Personalized experience their own toggle when consents are separate", () => {
    expect(getPrivacyRowIds({ separateAnalyticsConsents: true })).toEqual([
      "bugReports",
      "appPerformance",
      "personalizedExperience",
      "privacyPolicy",
    ]);
  });

  it("shows one Analytics toggle when consents are not separate", () => {
    expect(getPrivacyRowIds({ separateAnalyticsConsents: false })).toEqual([
      "bugReports",
      "analytics",
      "privacyPolicy",
    ]);
  });
});

describe("getPrivacyToggleValue", () => {
  it("reads each consent for its own toggle", () => {
    const current = values({
      bugReports: true,
      analytics: false,
      personalizedRecommendations: true,
    });

    expect(getPrivacyToggleValue("bugReports", current)).toBe(true);
    expect(getPrivacyToggleValue("appPerformance", current)).toBe(false);
    expect(getPrivacyToggleValue("personalizedExperience", current)).toBe(true);
  });

  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])(
    "turns the Analytics toggle on only when both consents are given (analytics %s, recommendations %s)",
    (analytics, personalizedRecommendations, expected) => {
      expect(
        getPrivacyToggleValue("analytics", values({ analytics, personalizedRecommendations })),
      ).toBe(expected);
    },
  );
});

describe("toPrivacyUpdate", () => {
  it("changes the consent behind each toggle", () => {
    expect(toPrivacyUpdate("bugReports", true)).toEqual({ key: "bugReports", value: true });
    expect(toPrivacyUpdate("appPerformance", false)).toEqual({ key: "analytics", value: false });
    expect(toPrivacyUpdate("personalizedExperience", true)).toEqual({
      key: "personalizedRecommendations",
      value: true,
    });
    expect(toPrivacyUpdate("analytics", true)).toEqual({
      key: "analyticsAndRecommendations",
      value: true,
    });
  });
});
