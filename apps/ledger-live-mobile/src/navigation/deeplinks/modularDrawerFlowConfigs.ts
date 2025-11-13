import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { ScreenName, NavigatorName } from "~/const";

export interface ScreenConfig {
  screens: Record<string, string | Record<string, unknown>>;
}

export interface DrawerFlowConfigs {
  modularDrawer: Record<string, ScreenConfig>;
}

/**
 * Helper to create modular drawer or classic flow configs for deeplinks
 * @param modularDrawer - The modular drawer feature flag
 * @returns Configuration object for modular drawer and classic flows
 */
export function getDrawerFlowConfigs(
  modularDrawer: Feature_ModularDrawer | null,
): DrawerFlowConfigs {
  const isModularDrawerEnabled = modularDrawer?.enabled;

  if (isModularDrawerEnabled) {
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

  return {
    modularDrawer: {},
  };
}
