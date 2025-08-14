import { type Feature_OnboardingIgnoredOSUpdates } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getIgnoredOSUpdatesForDeviceModelAndPlatform } from "./getIgnoredOSUpdatesForDeviceModelAndPlatform";

describe("getIgnoredOSUpdatesForDeviceModelAndPlatform", () => {
  const mockConfig: Feature_OnboardingIgnoredOSUpdates["params"] = {
    ios: {
      [DeviceModelId.nanoS]: ["1.6.0", "1.6.1"],
      [DeviceModelId.nanoX]: ["2.0.0"],
      [DeviceModelId.nanoSP]: ["1.0.0", "1.0.1", "1.0.2"],
    },
    android: {
      [DeviceModelId.nanoS]: ["1.5.0"],
      [DeviceModelId.nanoX]: ["2.1.0", "2.1.1"],
    },
    macos: {
      [DeviceModelId.nanoX]: ["2.2.0"],
    },
    windows: {
      [DeviceModelId.stax]: ["3.0.0"],
    },
    linux: {
      [DeviceModelId.europa]: ["4.0.0", "4.0.1"],
    },
  };

  describe("when config is undefined", () => {
    it("should return empty array", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        undefined,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });
  });

  describe("when config is null", () => {
    it("should return empty array", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        null as unknown as Feature_OnboardingIgnoredOSUpdates["params"],
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });
  });

  describe("when platform does not exist in config", () => {
    it("should return empty array", () => {
      const configWithoutPlatform: Feature_OnboardingIgnoredOSUpdates["params"] = {
        ios: { [DeviceModelId.nanoS]: ["1.6.0"] },
      };

      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        configWithoutPlatform,
        DeviceModelId.nanoS,
        "android",
      );
      expect(result).toEqual([]);
    });
  });

  describe("when device model does not exist for platform", () => {
    it("should return empty array", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.stax,
        "ios",
      );
      expect(result).toEqual([]);
    });
  });

  describe("when device model exists but has no ignored updates", () => {
    it("should return empty array", () => {
      const configWithEmptyArray: Feature_OnboardingIgnoredOSUpdates["params"] = {
        ios: {
          [DeviceModelId.nanoS]: [],
        },
      };

      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        configWithEmptyArray,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });
  });

  describe("when device model exists and has ignored updates", () => {
    it("should return the ignored updates for iOS", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual(["1.6.0", "1.6.1"]);
    });

    it("should return the ignored updates for Android", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.nanoX,
        "android",
      );
      expect(result).toEqual(["2.1.0", "2.1.1"]);
    });

    it("should return multiple ignored updates", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.nanoSP,
        "ios",
      );
      expect(result).toEqual(["1.0.0", "1.0.1", "1.0.2"]);
    });

    it("should return ignored updates for macOS", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.nanoX,
        "macos",
      );
      expect(result).toEqual(["2.2.0"]);
    });

    it("should return ignored updates for Windows", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.stax,
        "windows",
      );
      expect(result).toEqual(["3.0.0"]);
    });

    it("should return ignored updates for Linux", () => {
      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        mockConfig,
        DeviceModelId.europa,
        "linux",
      );
      expect(result).toEqual(["4.0.0", "4.0.1"]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty config object", () => {
      const emptyConfig: Feature_OnboardingIgnoredOSUpdates["params"] = {};

      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        emptyConfig,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });

    it("should handle config with empty platform objects", () => {
      const configWithEmptyPlatforms: Feature_OnboardingIgnoredOSUpdates["params"] = {
        ios: {},
        android: {},
        macos: {},
        windows: {},
        linux: {},
      };

      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        configWithEmptyPlatforms,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });

    it("should handle undefined device model entries", () => {
      const configWithUndefined: Feature_OnboardingIgnoredOSUpdates["params"] = {
        ios: {
          [DeviceModelId.nanoS]: undefined as unknown as string[],
        },
      };

      const result = getIgnoredOSUpdatesForDeviceModelAndPlatform(
        configWithUndefined,
        DeviceModelId.nanoS,
        "ios",
      );
      expect(result).toEqual([]);
    });
  });
});
