import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import type { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const ethereumCurrency = getCryptoCurrencyById("ethereum");
export const arbitrumCurrency = getCryptoCurrencyById("arbitrum");
export const baseCurrency = getCryptoCurrencyById("base");
export const scrollCurrency = getCryptoCurrencyById("scroll");
export const injectiveCurrency = getCryptoCurrencyById("injective");

export const hederaCurrency = getCryptoCurrencyById("hedera");

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
export const usdcToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ethereumCurrency,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
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

export enum LoadingStatus {
  Success = "success",
}

export { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";

export const formatCurrencyUnit = () => "100.00";
