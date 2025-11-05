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
    receive_flow = false,
  ): Feature_ModularDrawer => {
    return {
      enabled,
      params: {
        add_account,
        live_app: false,
        live_apps_allowlist: [],
        live_apps_blocklist: [],
        receive_flow,
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
        classicReceive: {
          [NavigatorName.ReceiveFunds]: {
            screens: {
              [ScreenName.ReceiveSelectCrypto]: "receive",
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
        classicReceive: {
          [NavigatorName.ReceiveFunds]: {
            screens: {
              [ScreenName.ReceiveSelectCrypto]: "receive",
            },
          },
        },
      });
    });
  });

  describe("when modular drawer is enabled", () => {
    it("should return modular drawer config for add_account only", () => {
      const modularDrawer = createModularDrawerFeature(true, true, false);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toEqual({
        modularDrawer: {
          [NavigatorName.ModularDrawer]: {
            screens: {
              [ScreenName.AddAccountDeepLinkHandler]: "add-account",
            },
          },
        },
        classicAddAccount: {},
        classicReceive: {
          [NavigatorName.ReceiveFunds]: {
            screens: {
              [ScreenName.ReceiveSelectCrypto]: "receive",
            },
          },
        },
      });
    });

    it("should return modular drawer config for receive_flow only", () => {
      const modularDrawer = createModularDrawerFeature(true, false, true);

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
        classicReceive: {},
      });
    });

    it("should return modular drawer config for both add_account and receive_flow", () => {
      const modularDrawer = createModularDrawerFeature(true, true, true);

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
        classicReceive: {},
      });
    });

    it("should return classic configs when modular drawer is enabled but no params are true", () => {
      const modularDrawer = createModularDrawerFeature(true);

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
        classicReceive: {
          [NavigatorName.ReceiveFunds]: {
            screens: {
              [ScreenName.ReceiveSelectCrypto]: "receive",
            },
          },
        },
      });
    });
  });

  describe("edge cases", () => {
    it("should return consistent structure regardless of input", () => {
      const modularDrawer = createModularDrawerFeature(true, true, true);

      const result = getDrawerFlowConfigs(modularDrawer);

      expect(result).toHaveProperty("modularDrawer");
      expect(result).toHaveProperty("classicAddAccount");
      expect(result).toHaveProperty("classicReceive");

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
