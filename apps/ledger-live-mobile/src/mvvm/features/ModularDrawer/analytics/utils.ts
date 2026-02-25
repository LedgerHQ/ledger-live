import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export function formatAssetsConfig(assetsConfig?: EnhancedModularDrawerConfiguration["assets"]): {
  balance: boolean;
  market_trend: boolean;
  apy: boolean;
  filter: boolean;
} {
  if (!assetsConfig) {
    return {
      balance: false,
      market_trend: false,
      apy: false,
      filter: false,
    };
  }

  return {
    balance: assetsConfig.rightElement === "balance",
    market_trend: assetsConfig.rightElement === "marketTrend",
    apy: assetsConfig.leftElement === "apy",
    filter: assetsConfig.filter === "topNetworks",
  };
}

export function formatNetworksConfig(
  networksConfig?: EnhancedModularDrawerConfiguration["networks"],
): {
  balance: boolean;
  numberOfAccounts: boolean;
  numberOfAccountsAndApy: boolean;
} {
  if (!networksConfig) {
    return {
      balance: false,
      numberOfAccounts: false,
      numberOfAccountsAndApy: false,
    };
  }

  return {
    balance: networksConfig.rightElement === "balance",
    numberOfAccounts: networksConfig.leftElement === "numberOfAccounts",
    numberOfAccountsAndApy: networksConfig.leftElement === "numberOfAccountsAndApy",
  };
}
