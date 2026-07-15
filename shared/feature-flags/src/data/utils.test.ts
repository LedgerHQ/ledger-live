import { isValidFeatureId, getAllFeatureFlags } from "./utils";
import { FEATURE_FLAGS_DEFAULTS } from "../constants";
import type { Feature, FeatureId } from "./schema";

const mockFeature: Feature = { enabled: true };

describe("getAllFeatureFlags", () => {
  it("includes all flags when getFeature always returns a value", () => {
    const result = getAllFeatureFlags(() => mockFeature);
    const keys = Object.keys(FEATURE_FLAGS_DEFAULTS) as FeatureId[];
    expect(Object.keys(result)).toEqual(keys);
    keys.forEach(key => expect(result[key]).toBe(mockFeature));
  });

  it("omits flags for which getFeature returns null", () => {
    const result = getAllFeatureFlags(key => (key === "mockFeature" ? mockFeature : null));
    expect(result).toEqual({ mockFeature: mockFeature });
  });

  it("returns an empty object when getFeature always returns null", () => {
    expect(getAllFeatureFlags(() => null)).toEqual({});
  });
});

describe("isValidFeatureId", () => {
  it("returns true for a registered flag id", () => {
    expect(isValidFeatureId("mockFeature")).toBe(true);
    expect(isValidFeatureId("ptxCard")).toBe(true);
  });

  it("returns false for an unknown id", () => {
    expect(isValidFeatureId("nonexistent_flag_xyz")).toBe(false);
  });
});
