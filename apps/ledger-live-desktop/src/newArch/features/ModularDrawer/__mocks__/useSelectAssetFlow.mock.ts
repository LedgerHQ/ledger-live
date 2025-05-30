import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export const bitcoinCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  coinType: 60,
  name: "Bitcoin",
  managerAppName: "Bitcoin",
  ticker: "BTC",
  scheme: "bitcoin",
  color: "#ffae35",
  family: "bitcoin",
  units: [
    {
      name: "bitcoin",
      code: "BTC",
      magnitude: 8,
    },
  ],
  explorerId: "btc",
  explorerViews: [],
};

export const ethereumCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "evm",
  units: [
    {
      name: "ether",
      code: "ETH",
      magnitude: 18,
    },
  ],
  explorerId: "eth",
  explorerViews: [],
};

export const arbitrumCurrency = {
  type: "CryptoCurrency" as const,
  id: "arbitrum" as const,
  coinType: 60,
  name: "Arbitrum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "arbitrum",
  color: "#28a0f0",
  family: "evm",
  units: [
    {
      name: "ETH",
      code: "ETH",
      magnitude: 18,
    },
  ],
  explorerViews: [],
};

export const arbitrumToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "arbitrum/erc20/arbitrum",
  contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  parentCurrency: arbitrumCurrency,
  tokenType: "erc20",
  name: "Arbitrum",
  ticker: "ARB",
  units: [
    {
      name: "Arbitrum",
      code: "ARB",
      magnitude: 18,
    },
  ],
};

export const arbitrumAssetType: AssetType = {
  id: "arbitrum",
  name: "Arbitrum",
  ticker: "ARB",
};

export const bitcoinAssetType: AssetType = {
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
};

export const ethereumAssetType: AssetType = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
};

export const findCryptoCurrencyById = (id: string) =>
  [bitcoinCurrency, ethereumCurrency, arbitrumCurrency].find(a => a.id === id);

export const mockAssetsConfiguration: EnhancedModularDrawerConfiguration["assets"] = {
  filter: "topNetworks",
  leftElement: "apy",
  rightElement: "balance",
};

export const mockNetworksConfiguration: EnhancedModularDrawerConfiguration["networks"] = {
  leftElement: "numberOfAccounts",
  rightElement: "balance",
};
