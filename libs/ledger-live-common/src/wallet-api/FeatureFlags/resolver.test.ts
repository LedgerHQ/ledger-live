import { getFeatureFlagsForLiveApp } from "./resolver";
import { getFeature } from "../../featureFlags/firebaseFeatureFlags";
import { LiveAppManifest } from "../../platform/types";
import { Feature } from "@ledgerhq/types-live";

jest.mock("../../featureFlags/firebaseFeatureFlags");

const mockGetFeature = jest.mocked(getFeature);

describe("getFeatureFlagsForLiveApp", () => {
  const createMockManifest = (featureFlags?: string[]): LiveAppManifest => {
    return {
      id: "test-app",
      name: "Test App",
      url: "https://example.com",
      homepageUrl: "https://example.com",
      platforms: ["desktop"],
      apiVersion: "1.0.0",
      manifestVersion: "1.0.0",
      branch: "stable",
      permissions: [],
      domains: ["example.com"],
      categories: ["test"],
      currencies: "*",
      visibility: "complete",
      content: {
        shortDescription: { en: "Test" },
        description: { en: "Test" },
      },
      featureFlags,
    };
  };

  const createMockFeature = (enabled: boolean): Feature<unknown> => ({
    enabled,
    params: { test: "value" },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty object when manifest has no featureFlags field", () => {
    const manifest = createMockManifest(undefined);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1", "testFeature2"],
      manifest,
    });

    expect(result).toEqual({});
    expect(mockGetFeature).not.toHaveBeenCalled();
  });

  it("should filter requested features based on manifest allowlist", () => {
    const manifest = createMockManifest(["testFeature1"]);
    const mockFeature = createMockFeature(true);

    mockGetFeature.mockReturnValue(mockFeature);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1", "testFeature2"],
      manifest,
    });

    expect(result).toEqual({
      testFeature1: mockFeature,
    });
    expect(mockGetFeature).toHaveBeenCalledTimes(1);
    expect(mockGetFeature).toHaveBeenCalledWith({
      key: "testFeature1",
      appLanguage: undefined,
      allowOverride: true,
    });
  });

  it("should return empty object when manifest has empty allowlist", () => {
    const manifest = createMockManifest([]);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1"],
      manifest,
    });

    expect(result).toEqual({});
    expect(mockGetFeature).not.toHaveBeenCalled();
  });

  it("should return null for non-existent feature flags", () => {
    const manifest = createMockManifest(["testFeature1"]);

    mockGetFeature.mockImplementation(() => {
      throw new Error("Feature not found");
    });

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1"],
      manifest,
    });

    expect(result).toEqual({
      testFeature1: null,
    });
  });

  it("should handle multiple allowed and disallowed flags", () => {
    const manifest = createMockManifest(["flag1", "flag3", "flag5"]);
    const mockFeature = createMockFeature(true);

    mockGetFeature.mockReturnValue(mockFeature);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["flag1", "flag2", "flag3", "flag4", "flag5"],
      manifest,
    });

    expect(result).toEqual({
      flag1: mockFeature,
      flag3: mockFeature,
      flag5: mockFeature,
    });
    expect(mockGetFeature).toHaveBeenCalledTimes(3);
  });

  it("should handle mix of successful and failed feature retrievals", () => {
    const manifest = createMockManifest(["flag1", "flag2", "flag3"]);
    const mockFeature = createMockFeature(true);

    mockGetFeature.mockImplementation(({ key }) => {
      if (String(key) === "flag2") {
        throw new Error("Feature not found");
      }
      return mockFeature;
    });

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["flag1", "flag2", "flag3"],
      manifest,
    });

    expect(result).toEqual({
      flag1: mockFeature,
      flag2: null,
      flag3: mockFeature,
    });
  });
});
