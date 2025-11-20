import { ScreenName, NavigatorName } from "~/const";

export interface ScreenConfig {
  screens: Record<string, string | Record<string, unknown>>;
}

export interface DrawerFlowConfigs {
  modularDrawer: Record<string, ScreenConfig>;
}

/**
 * Helper to create modular drawer or classic flow configs for deeplinks
 * @returns Configuration object for modular drawer and classic flows
 */
export function getDrawerFlowConfigs(): DrawerFlowConfigs {
  return {
    modularDrawer: {
      [NavigatorName.ModularDrawer]: {
        screens: {
          [ScreenName.AddAccountDeepLinkHandler]: "add-account",
          [ScreenName.ReceiveDeepLinkHandler]: "receive",
        },
      },
    },
  };
}
