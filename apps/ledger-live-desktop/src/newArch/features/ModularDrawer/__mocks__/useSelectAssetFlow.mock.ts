import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { fn, Mock } from "@storybook/test";

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

export const arbitrumParentCurrency: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "arbitrum",
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

export const arbitrumCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "arbitrum/erc20/arbitrum",
  contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  parentCurrency: arbitrumParentCurrency,
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

const res = {
  result: {
    currenciesByProvider: [
      {
        providerId: "bitcoin",
        currenciesByNetwork: [bitcoinCurrency],
      },
      {
        providerId: "ethereum",
        currenciesByNetwork: [ethereumCurrency, arbitrumCurrency.parentCurrency],
      },
      { providerId: "arbitrum", currenciesByNetwork: [arbitrumCurrency] },
    ],
    sortedCryptoCurrencies: [bitcoinCurrency, ethereumCurrency, arbitrumCurrency],
  },
  loadingStatus: "success",
};

export const useGroupedCurrenciesByProvider: Mock = fn(() => res);

export const findCryptoCurrencyById = (id: string) =>
  [bitcoinCurrency, ethereumCurrency, arbitrumCurrency.parentCurrency].find(a => a.id === id);

export const mockAssetsConfiguration: EnhancedModularDrawerConfiguration["assets"] = {
  filter: "topNetworks",
  leftElement: "apy",
  rightElement: "balance",
};

export const mockNetworksConfiguration: EnhancedModularDrawerConfiguration["networks"] = {
  leftElement: "numberOfAccounts",
  rightElement: "balance",
};
