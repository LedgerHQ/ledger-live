import { Feature_ModularDrawer } from "@ledgerhq/types-live";
import { ScreenName, NavigatorName } from "~/const";

export interface ScreenConfig {
  screens: Record<string, string | Record<string, unknown>>;
}

export interface DrawerFlowConfigs {
  modularDrawer: Record<string, ScreenConfig>;
  classicAddAccount: Record<string, ScreenConfig>;
  classicReceive: Record<string, ScreenConfig>;
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
  const hasAddAccount = modularDrawer?.params?.add_account;
  const hasReceive = modularDrawer?.params?.receive_flow;

  const classicAddAccountConfig = {
    [NavigatorName.AssetSelection]: {
      screens: {
        [ScreenName.AddAccountsSelectCrypto]: "add-account",
      },
    },
  };

  const classicReceiveConfig = {
    [NavigatorName.ReceiveFunds]: {
      screens: {
        [ScreenName.ReceiveSelectCrypto]: "receive",
      },
    },
  };

  if (isModularDrawerEnabled && (hasAddAccount || hasReceive)) {
    return {
      modularDrawer: {
        [NavigatorName.ModularDrawer]: {
          screens: {
            ...(hasAddAccount && {
              [ScreenName.AddAccountDeepLinkHandler]: "add-account",
            }),
            ...(hasReceive && {
              [ScreenName.ReceiveDeepLinkHandler]: "receive",
            }),
          },
        },
      },
      classicAddAccount: hasAddAccount ? {} : classicAddAccountConfig,
      classicReceive: hasReceive ? {} : classicReceiveConfig,
    };
  }

  return {
    modularDrawer: {},
    classicAddAccount: classicAddAccountConfig,
    classicReceive: classicReceiveConfig,
  };
}
