import { handlers } from "./server";
import { getFeatureFlagsForLiveApp } from "./resolver";
import { LiveAppManifest } from "../../platform/types";

jest.mock("./resolver");

jest.mock("@ledgerhq/wallet-api-server", () => ({
  RPCHandler: jest.fn(),
  customWrapper: jest.fn(handler => handler),
}));

const mockGetFeatureFlagsForLiveApp = jest.mocked(getFeatureFlagsForLiveApp);

describe("FeatureFlags server handlers", () => {
  const createMockManifest = (): LiveAppManifest => {
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
      featureFlags: ["flag1", "flag2"],
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("featureFlags.get handler", () => {
    it("should return features in correct format", () => {
      const manifest = createMockManifest();
      const mockFeatures = {
        flag1: { enabled: true, params: {} },
        flag2: { enabled: false, params: {} },
      };

      mockGetFeatureFlagsForLiveApp.mockReturnValue(mockFeatures);

      const handlerInstance = handlers({ manifest, appLanguage: "en" });
      // @ts-expect-error - customWrapper is mocked to simplify testing
      const result = handlerInstance["featureFlags.get"]({
        featureFlagIds: ["flag1", "flag2"],
      });

      expect(result).toEqual({ features: mockFeatures });
      expect(mockGetFeatureFlagsForLiveApp).toHaveBeenCalledWith({
        requestedFeatureFlagIds: ["flag1", "flag2"],
        manifest,
        appLanguage: "en",
      });
    });

    it("should handle empty featureFlagIds array", () => {
      const manifest = createMockManifest();
      mockGetFeatureFlagsForLiveApp.mockReturnValue({});

      const handlerInstance = handlers({ manifest });
      // @ts-expect-error - customWrapper is mocked to simplify testing
      const result = handlerInstance["featureFlags.get"]({
        featureFlagIds: [],
      });

      expect(result).toEqual({ features: {} });
      expect(mockGetFeatureFlagsForLiveApp).toHaveBeenCalledWith({
        requestedFeatureFlagIds: [],
        manifest,
        appLanguage: undefined,
      });
    });

    it("should handle undefined params", () => {
      const manifest = createMockManifest();
      mockGetFeatureFlagsForLiveApp.mockReturnValue({});

      const handlerInstance = handlers({ manifest });
      // @ts-expect-error - Testing runtime behavior with undefined params, customWrapper is mocked
      const result = handlerInstance["featureFlags.get"](undefined);

      expect(result).toEqual({ features: {} });
      expect(mockGetFeatureFlagsForLiveApp).toHaveBeenCalledWith({
        requestedFeatureFlagIds: [],
        manifest,
        appLanguage: undefined,
      });
    });

    it("should include null values for non-existent flags", () => {
      const manifest = createMockManifest();
      const mockFeatures = {
        flag1: { enabled: true, params: {} },
        flag2: null,
      };

      mockGetFeatureFlagsForLiveApp.mockReturnValue(mockFeatures);

      const handlerInstance = handlers({ manifest });
      // @ts-expect-error - customWrapper is mocked to simplify testing
      const result = handlerInstance["featureFlags.get"]({
        featureFlagIds: ["flag1", "flag2"],
      });

      expect(result).toEqual({ features: mockFeatures });
    });
  });
});
