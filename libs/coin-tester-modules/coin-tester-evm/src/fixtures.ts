import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export const ETHEREUM = getCryptoCurrencyById("ethereum");
export const POLYGON = getCryptoCurrencyById("polygon");
export const BLAST = getCryptoCurrencyById("blast");
export const SCROLL = getCryptoCurrencyById("scroll");
export const SONIC = getCryptoCurrencyById("sonic");

export const USDC_ON_ETHEREUM: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ETHEREUM,
  tokenType: "erc20",
};

export const USDC_ON_POLYGON: TokenCurrency = {
  type: "TokenCurrency",
  id: "polygon/erc20/usd_coin_(pos)",
  name: "USD Coin (PoS)",
  ticker: "USDC",
  units: [{ name: "USD Coin (PoS)", code: "USDC", magnitude: 6 }],
  contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  parentCurrency: POLYGON,
  tokenType: "erc20",
};

export const USDC_ON_SCROLL: TokenCurrency = {
  type: "TokenCurrency",
  id: "scroll/erc20/usd_coin",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  contractAddress: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
  parentCurrency: SCROLL,
  tokenType: "erc20",
};

export const USDC_ON_SONIC: TokenCurrency = {
  type: "TokenCurrency",
  id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
  name: "Bridged USDC (Sonic Labs)",
  ticker: "USDC",
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
  contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
  parentCurrency: SONIC,
  tokenType: "erc20",
};

export const MIM_ON_BLAST: TokenCurrency = {
  type: "TokenCurrency",
  id: "blast/erc20/magic_internet_money",
  name: "Magic Internet Money",
  ticker: "MIM",
  units: [{ name: "Magic Internet Money", code: "MIM", magnitude: 18 }],
  contractAddress: "0x76DA31D7C9CbEAE102aff34D3398bC450c8374c1",
  parentCurrency: BLAST,
  tokenType: "erc20",
};
