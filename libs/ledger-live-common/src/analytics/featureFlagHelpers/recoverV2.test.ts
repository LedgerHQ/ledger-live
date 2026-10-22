import type { AnalyticsFeatureFlagMethod } from "../types";
import { getRecoverV2Attribute } from "./recoverV2";

const methodReturning = (value: { enabled: boolean } | null): AnalyticsFeatureFlagMethod =>
  (() => value) as AnalyticsFeatureFlagMethod;

describe("getRecoverV2Attribute", () => {
  it("should be false when the flag method is missing", () => {
    expect(getRecoverV2Attribute(null)).toBe(false);
  });

  it("should be false when the flag is missing", () => {
    expect(getRecoverV2Attribute(methodReturning(null))).toBe(false);
  });

  it("should be false when the flag is disabled", () => {
    expect(getRecoverV2Attribute(methodReturning({ enabled: false }))).toBe(false);
  });

  it("should be true when the flag is enabled", () => {
    expect(getRecoverV2Attribute(methodReturning({ enabled: true }))).toBe(true);
  });
});
