import BigNumber from "bignumber.js";
import { cryptocurrenciesById, getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const BTC: CryptoCurrency = cryptocurrenciesById["bitcoin"];
export const ETH: CryptoCurrency = cryptocurrenciesById["ethereum"];

export const USD: FiatCurrency = getFiatCurrencyByTicker("USD");
export const EUR: FiatCurrency = getFiatCurrencyByTicker("EUR");

export const USDC: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_coin",
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrencyId: ETH.id,
  tokenType: "erc20",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

// Binance-Peg USDC on BNB Chain uses 18 decimals, unlike Ethereum USDC's 6.
// Same asset, different magnitude — used to cover cross-network aggregation.
export const USDC_BSC: TokenCurrency = {
  type: "TokenCurrency",
  id: "bsc/bep20/binance_peg_usd_coin",
  contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  parentCurrencyId: "bsc",
  tokenType: "bep20",
  ticker: "USDC",
  name: "Binance-Peg USD Coin",
  units: [
    {
      name: "USDC",
      code: "USDC",
      magnitude: 18,
    },
  ],
};

// Atomic-unit magnitudes (1 unit = 10^magnitude atoms). Centralised here so
// scenarios don't redeclare them.
export const SAT = new BigNumber(10).pow(BTC.units[0].magnitude); // 1e8
export const WEI = new BigNumber(10).pow(ETH.units[0].magnitude); // 1e18
export const USDC_UNIT = new BigNumber(10).pow(USDC.units[0].magnitude); // 1e6
export const USDC_BSC_UNIT = new BigNumber(10).pow(USDC_BSC.units[0].magnitude); // 1e18
