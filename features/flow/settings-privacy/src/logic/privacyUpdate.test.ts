import type { PrivacySideEffects } from "../ports";
import type { PrivacyUpdate } from "../types";
import { applyPrivacyUpdate, isPrivacyUpdate } from "./privacyUpdate";

const createEffects = () =>
  ({
    setBugReports: jest.fn(),
    setAnalytics: jest.fn(),
    setPersonalizedRecommendations: jest.fn(),
    setAnalyticsAndRecommendations: jest.fn(),
  }) satisfies PrivacySideEffects;

describe("applyPrivacyUpdate", () => {
  it.each<[PrivacyUpdate, keyof PrivacySideEffects]>([
    [{ key: "bugReports", value: false }, "setBugReports"],
    [{ key: "analytics", value: true }, "setAnalytics"],
    [{ key: "personalizedRecommendations", value: true }, "setPersonalizedRecommendations"],
    [{ key: "analyticsAndRecommendations", value: false }, "setAnalyticsAndRecommendations"],
  ])("runs only %o through %s", (update, effect) => {
    const effects = createEffects();

    applyPrivacyUpdate(effects, update);

    for (const [name, mock] of Object.entries(effects)) {
      expect(mock.mock.calls).toEqual(name === effect ? [[update.value]] : []);
    }
  });
});

describe("isPrivacyUpdate", () => {
  it("recognizes the changes of the Privacy section", () => {
    expect(isPrivacyUpdate({ key: "bugReports" })).toBe(true);
    expect(isPrivacyUpdate({ key: "analytics" })).toBe(true);
    expect(isPrivacyUpdate({ key: "personalizedRecommendations" })).toBe(true);
    expect(isPrivacyUpdate({ key: "analyticsAndRecommendations" })).toBe(true);
  });

  it("leaves the changes of the other sections", () => {
    expect(isPrivacyUpdate({ key: "hideBalance" })).toBe(false);
    expect(isPrivacyUpdate({ key: "separateAnalyticsConsents" })).toBe(false);
  });
});
