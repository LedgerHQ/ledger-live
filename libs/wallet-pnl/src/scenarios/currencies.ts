import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { FIAT_CURRENCIES_BY_TICKER } from "@domain/entity-currency-fiat";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { FiatCurrency } from "@domain/entity-currency-fiat";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";

export const BTC: CryptoCurrency = getCryptoCurrencyById("bitcoin");
export const ETH: CryptoCurrency = getCryptoCurrencyById("ethereum");

export const USD: FiatCurrency = FIAT_CURRENCIES_BY_TICKER["USD"];
export const EUR: FiatCurrency = FIAT_CURRENCIES_BY_TICKER["EUR"];

export const USDC: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd_coin"),
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
  id: TokenCurrencyIdSchema.parse("bsc/bep20/binance_peg_usd_coin"),
  contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("bsc"),
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
