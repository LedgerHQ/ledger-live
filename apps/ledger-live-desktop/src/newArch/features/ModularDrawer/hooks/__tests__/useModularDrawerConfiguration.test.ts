import { renderHook } from "tests/testSetup";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { useModularDrawerConfiguration } from "../useModularDrawerConfiguration";

jest.mock("@ledgerhq/live-common/featureFlags/useFeature", () => jest.fn());

const mockUseFeature = jest.mocked(useFeature);

describe("useModularDrawerConfiguration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when modularization is disabled", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue({
        enabled: true,
        params: {
          enableModularization: false,
        },
      });
    });

    it("should return disabled configurations when no drawer configuration is provided", () => {
      const { result } = renderHook(() => useModularDrawerConfiguration());

      expect(result.current.assetsConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
        filter: "undefined",
      });
      expect(result.current.networkConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
      });
    });

    it("should return disabled configurations even when drawer configuration is provided", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "apy",
          filter: "topNetworks",
        },
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccounts",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
        filter: "undefined",
      });
      expect(result.current.networkConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
      });
    });
  });

  describe("when modularization is enabled", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue({
        enabled: true,
        params: {
          enableModularization: true,
        },
      });
    });

    it("should return undefined configurations when no drawer configuration is provided", () => {
      const { result } = renderHook(() => useModularDrawerConfiguration());

      expect(result.current.assetsConfiguration).toBeUndefined();
      expect(result.current.networkConfiguration).toBeUndefined();
    });

    it("should return the provided drawer configuration when modularization is enabled", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "apy",
          filter: "topNetworks",
        },
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccounts",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual(drawerConfiguration.assets);
      expect(result.current.networkConfiguration).toEqual(drawerConfiguration.networks);
    });

    it("should handle partial drawer configuration", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "priceVariation",
          filter: "topNetworks",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual(drawerConfiguration.assets);
      expect(result.current.networkConfiguration).toBeUndefined();
    });

    it("should handle configuration with undefined values", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: undefined,
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccountsAndApy",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toBeUndefined();
      expect(result.current.networkConfiguration).toEqual(drawerConfiguration.networks);
    });
  });

  describe("when feature flag is not available", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue(null);
    });

    it("should default to disabled configuration when feature flag returns null", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "apy",
          filter: "topNetworks",
        },
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccounts",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
        filter: "undefined",
      });
      expect(result.current.networkConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
      });
    });
  });

  describe("when feature flag params are not available", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue({
        enabled: true,
        params: undefined,
      });
    });

    it("should default to disabled configuration when params are undefined", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "apy",
          filter: "topNetworks",
        },
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccounts",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
        filter: "undefined",
      });
      expect(result.current.networkConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
      });
    });
  });

  describe("when enableModularization param is not available", () => {
    beforeEach(() => {
      mockUseFeature.mockReturnValue({
        enabled: true,
        params: {},
      });
    });

    it("should default to disabled configuration when enableModularization is not in params", () => {
      const drawerConfiguration: EnhancedModularDrawerConfiguration = {
        assets: {
          rightElement: "balance",
          leftElement: "apy",
          filter: "topNetworks",
        },
        networks: {
          rightElement: "balance",
          leftElement: "numberOfAccounts",
        },
      };

      const { result } = renderHook(() => useModularDrawerConfiguration(drawerConfiguration));

      expect(result.current.assetsConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
        filter: "undefined",
      });
      expect(result.current.networkConfiguration).toEqual({
        rightElement: "undefined",
        leftElement: "undefined",
      });
    });
  });
});
