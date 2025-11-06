import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { getDrawerFlowConfigs } from "../modularDrawerFlowConfigs";
import { ScreenName, NavigatorName } from "~/const";

describe("getDrawerFlowConfigs", () => {
  /**
   * Helper function to create a Feature_ModularDrawer object with default values
   */
  const createModularDrawerFeature = (
    enabled: boolean,
    add_account = false,
  ): Feature_ModularDrawer => {
    return {
      enabled,
      params: {
        add_account,
        live_app: false,
        live_apps_allowlist: [],
        live_apps_blocklist: [],
        receive_flow: true,
        send_flow: false,
        enableModularization: false,
        searchDebounceTime: 300,
        backendEnvironment: "production",
      },
    };
  };

  describe("when modular drawer is disabled", () => {
    it("should return empty modular drawer config and classic configs", () => {
      const modularDrawer = createModularDrawerFeature(false);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {},
        classicAddAccount: {
          [NavigatorName.AssetSelection]: {
            screens: {
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
            },
          },
        },
      });
    });

    it("should handle null modular drawer", () => {
      const result = getDrawerFlowConfigs(null);

      expect(result).toEqual({
        modularDrawer: {},
        classicAddAccount: {
          [NavigatorName.AssetSelection]: {
            screens: {
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
            },
          },
        },
      });
    });
  });

  describe("when modular drawer is enabled", () => {
    it("should return modular drawer config for add_account only", () => {
      const modularDrawer = createModularDrawerFeature(true, true);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {
          [NavigatorName.ModularDrawer]: {
            screens: {
              [ScreenName.AddAccountDeepLinkHandler]: "add-account",
              [ScreenName.ReceiveDeepLinkHandler]: "receive",
            },
          },
        },
        classicAddAccount: {},
      });
    });

    it("should return modular drawer config for receive_flow only", () => {
      const modularDrawer = createModularDrawerFeature(true, false);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {
          [NavigatorName.ModularDrawer]: {
            screens: {
              [ScreenName.ReceiveDeepLinkHandler]: "receive",
            },
          },
        },
        classicAddAccount: {
          [NavigatorName.AssetSelection]: {
            screens: {
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
            },
          },
        },
      });
    });

    it("should return modular drawer config for both add_account and receive_flow", () => {
      const modularDrawer = createModularDrawerFeature(true, true);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {
          [NavigatorName.ModularDrawer]: {
            screens: {
              [ScreenName.AddAccountDeepLinkHandler]: "add-account",
              [ScreenName.ReceiveDeepLinkHandler]: "receive",
            },
          },
        },
        classicAddAccount: {},
      });
    });

    it("should return classic configs when modular drawer is enabled but no params are true", () => {
      const modularDrawer = createModularDrawerFeature(true);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {
          [NavigatorName.ModularDrawer]: {
            screens: {
              [ScreenName.ReceiveDeepLinkHandler]: "receive",
            },
          },
        },
        classicAddAccount: {
          [NavigatorName.AssetSelection]: {
            screens: {
              [ScreenName.AddAccountsSelectCrypto]: "add-account",
            },
          },
        },
      });
    });
  });

  describe("edge cases", () => {
    it("should return consistent structure regardless of input", () => {
      const modularDrawer = createModularDrawerFeature(true, true);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toHaveProperty("modularDrawer");
      expect(result).toHaveProperty("classicAddAccount");

      expect(result.modularDrawer[NavigatorName.ModularDrawer]).toHaveProperty("screens");
    });
  });

  describe("type safety", () => {
    it("should accept null as modular drawer parameter", () => {
      expect(() => {
        getDrawerFlowConfigs(null);
      }).not.toThrow();
    });
  });
});
