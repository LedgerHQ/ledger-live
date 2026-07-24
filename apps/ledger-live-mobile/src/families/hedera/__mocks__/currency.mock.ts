import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencySchema, type TokenCurrency } from "@domain/entity-currency";

export const hederaCurrency = getCryptoCurrencyById("hedera");

export const htsToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencySchema.shape.id.parse("hedera/hts/0.0.123456"),
  name: "My HTS Token",
  ticker: "MHTS",
  units: [{ name: "My HTS Token", code: "MHTS", magnitude: 8 }],
  contractAddress: "0.0.123456",
  parentCurrencyId: hederaCurrency.id,
  tokenType: "hts",
};

export const erc20Token: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencySchema.shape.id.parse("hedera/erc20/0x1234"),
  name: "My ERC-20 Token",
  ticker: "MERC",
  units: [{ name: "My ERC-20 Token", code: "MERC", magnitude: 18 }],
  contractAddress: "0x1234",
  parentCurrencyId: hederaCurrency.id,
  tokenType: "erc20",
};
