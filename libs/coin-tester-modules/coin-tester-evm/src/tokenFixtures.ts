import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

const ethereum = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");
const scroll = getCryptoCurrencyById("scroll");
const blast = getCryptoCurrencyById("blast");
const sonic = getCryptoCurrencyById("sonic");
const core = getCryptoCurrencyById("core");

export const USDC_ON_ETHEREUM: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrency: ethereum,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as TokenCurrency;

export const USDC_ON_POLYGON: TokenCurrency = {
  type: "TokenCurrency",
  id: "polygon/erc20/usd_coin_(pos)",
  contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  parentCurrency: polygon,
  tokenType: "erc20",
  name: "USD Coin (PoS)",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as TokenCurrency;

export const USDC_ON_SCROLL: TokenCurrency = {
  type: "TokenCurrency",
  id: "scroll/erc20/usd_coin",
  contractAddress: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
  parentCurrency: scroll,
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDC", code: "USDC", magnitude: 6 }],
} as TokenCurrency;

export const MIM_ON_BLAST: TokenCurrency = {
  type: "TokenCurrency",
  id: "blast/erc20/magic_internet_money",
  contractAddress: "0x76DA31D7C9CbEAE102aff34D3398bC450c8374c1",
  parentCurrency: blast,
  tokenType: "erc20",
  name: "Magic Internet Money",
  ticker: "MIM",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "MIM", code: "MIM", magnitude: 18 }],
} as TokenCurrency;

export const BRIDGED_USDC_ON_SONIC: TokenCurrency = {
  type: "TokenCurrency",
  id: "sonic/erc20/bridged_usdc_sonic_labs_0x29219dd400f2bf60e5a23d13be72b486d4038894",
  contractAddress: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894",
  parentCurrency: sonic,
  tokenType: "erc20",
  name: "Bridged USDC (Sonic Labs)",
  ticker: "USDC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "Bridged USDC (Sonic Labs)", code: "USDC", magnitude: 6 }],
} as TokenCurrency;

export const STCORE_ON_CORE: TokenCurrency = {
  type: "TokenCurrency",
  id: "core/erc20/liquid_staked_core_0xb3a8f0f0da9ffc65318aa39e55079796093029ad",
  contractAddress: "0xb3a8f0f0da9ffc65318aa39e55079796093029ad",
  parentCurrency: core,
  tokenType: "erc20",
  name: "Liquid Staked CORE",
  ticker: "stCORE",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "stCORE", code: "stCORE", magnitude: 18 }],
} as TokenCurrency;

const cryptoAssetsStore = setupCalClientStore();
setCryptoAssetsStore(cryptoAssetsStore);
