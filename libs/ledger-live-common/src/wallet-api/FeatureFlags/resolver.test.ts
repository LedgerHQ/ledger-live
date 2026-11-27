import { getFeatureFlagsForLiveApp } from "./resolver";
import { LiveAppManifest } from "../../platform/types";
import { FEATURE_FLAGS_DEFAULTS, type Feature, type FeatureId } from "@shared/feature-flags";

describe("getFeatureFlagsForLiveApp", () => {
  const createMockManifest = (featureFlags?: string[] | "*"): LiveAppManifest => {
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

  let mockGetFeature: jest.Mock<Feature | null, [FeatureId]>;

  beforeEach(() => {
    mockGetFeature = jest.fn();
  });

  it("should return empty object when manifest has no featureFlags field", () => {
    const manifest = createMockManifest(undefined);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1", "testFeature2"],
      manifest,
      getFeature: mockGetFeature,
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
      getFeature: mockGetFeature,
    });

    expect(result).toEqual({
      testFeature1: mockFeature,
    });
    expect(mockGetFeature).toHaveBeenCalledTimes(1);
    expect(mockGetFeature).toHaveBeenCalledWith("testFeature1");
  });

  it("should return empty object when manifest has empty allowlist", () => {
    const manifest = createMockManifest([]);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["testFeature1"],
      manifest,
      getFeature: mockGetFeature,
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
      getFeature: mockGetFeature,
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
      getFeature: mockGetFeature,
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

    mockGetFeature.mockImplementation((key: FeatureId) => {
      if (String(key) === "flag2") {
        throw new Error("Feature not found");
      }
      return mockFeature;
    });

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["flag1", "flag2", "flag3"],
      manifest,
      getFeature: mockGetFeature,
    });

    expect(result).toEqual({
      flag1: mockFeature,
      flag2: null,
      flag3: mockFeature,
    });
  });

  it("should allow all feature flags when manifest featureFlags is wildcard '*' string", () => {
    const manifest = createMockManifest("*");
    const mockFeature = createMockFeature(true);

    mockGetFeature.mockReturnValue(mockFeature);

    const result = getFeatureFlagsForLiveApp({
      requestedFeatureFlagIds: ["flag1", "flag2", "flag3", "flag4"],
      manifest,
      getFeature: mockGetFeature,
    });

    expect(result).toEqual({
      flag1: mockFeature,
      flag2: mockFeature,
      flag3: mockFeature,
      flag4: mockFeature,
    });
    expect(mockGetFeature).toHaveBeenCalledTimes(4);
  });

  describe("the earnSolanaHighlightedValidators flag", () => {
    const FLAG = "earnSolanaHighlightedValidators";
    const configured: Feature<unknown> = {
      enabled: true,
      params: {
        validators: [
          { voteAccount: "ExampleVoteAccountA11111111111111111111111", provider: "Provider A" },
        ],
      },
    };

    it("reaches a live app whose manifest lists every flag, with its disabled default", () => {
      const result = getFeatureFlagsForLiveApp({
        requestedFeatureFlagIds: [FLAG],
        manifest: createMockManifest("*"),
        getFeature: id => FEATURE_FLAGS_DEFAULTS[id],
      });

      expect(result).toEqual({ [FLAG]: { enabled: false, params: { validators: [] } } });
    });

    it("reaches a live app whose manifest lists every flag, with the validators that are set", () => {
      const result = getFeatureFlagsForLiveApp({
        requestedFeatureFlagIds: [FLAG],
        manifest: createMockManifest("*"),
        getFeature: () => configured,
      });

      expect(result).toEqual({ [FLAG]: configured });
    });

    it("stays hidden from a manifest that lists other flags only", () => {
      const result = getFeatureFlagsForLiveApp({
        requestedFeatureFlagIds: [FLAG],
        manifest: createMockManifest(["earnWithdrawV2"]),
        getFeature: () => configured,
      });

      expect(result).toEqual({});
    });

    it("reaches a manifest that lists it", () => {
      const result = getFeatureFlagsForLiveApp({
        requestedFeatureFlagIds: [FLAG],
        manifest: createMockManifest([FLAG]),
        getFeature: () => configured,
      });

      expect(result).toEqual({ [FLAG]: configured });
    });
  });
});
