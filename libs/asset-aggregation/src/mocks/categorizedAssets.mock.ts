import { cryptocurrenciesById } from "@ledgerhq/cryptoassets";
import type { CategorizedAssetItem, CategorizedAssets } from "../assetCategorization/types";
import { makeToken } from "../assetCategorization/__tests__/fixtures";

const btc = cryptocurrenciesById["bitcoin"];
const eth = cryptocurrenciesById["ethereum"];
const usdc = makeToken("ethereum/erc20/usdc", "USDC", "USD Coin");

export const BITCOIN_ASSET: CategorizedAssetItem = {
  currency: btc,
  balance: 100000000,
  value: 97000,
  distribution: 0.7,
  accounts: [],
  price: 97000,
  priceChangePercentage24h: 2.3,
};

export const ETHEREUM_ASSET: CategorizedAssetItem = {
  currency: eth,
  balance: 5000000000000000000,
  value: 2700,
  distribution: 0.3,
  accounts: [],
  price: 2700,
  priceChangePercentage24h: -1.17,
};

export const STABLECOIN_ASSET: CategorizedAssetItem = {
  currency: usdc,
  balance: 1000000,
  value: 1000,
  distribution: 0.1,
  accounts: [],
  price: 1,
  priceChangePercentage24h: 0.01,
};

export const createMockCategorizedAssets = (
  overrides?: Partial<CategorizedAssets>,
): CategorizedAssets => ({
  cryptos: [BITCOIN_ASSET, ETHEREUM_ASSET],
  stablecoins: [STABLECOIN_ASSET],
  ...overrides,
});
