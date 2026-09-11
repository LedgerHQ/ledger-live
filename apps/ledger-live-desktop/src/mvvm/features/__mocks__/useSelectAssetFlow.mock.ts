import { getCryptoCurrencyById, CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema, type TokenCurrency } from "@domain/entity-currency-token";

export const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const ethereumCurrency = getCryptoCurrencyById("ethereum");
export const arbitrumCurrency = getCryptoCurrencyById("arbitrum");
export const baseCurrency = getCryptoCurrencyById("base");
export const scrollCurrency = getCryptoCurrencyById("scroll");
export const solanaCurrency = getCryptoCurrencyById("solana");
export const hederaCurrency = getCryptoCurrencyById("hedera");

export const arbitrumToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("arbitrum/erc20/arbitrum"),
  contractAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("arbitrum"),
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
  id: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
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
