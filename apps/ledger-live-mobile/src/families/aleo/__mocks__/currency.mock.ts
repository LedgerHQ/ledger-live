import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";

export const aleoCurrency = getCryptoCurrencyById("aleo");
export const aleoTestnetCurrency = getCryptoCurrencyById("aleo_testnet");

export const aleoTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "aleo/arc22/usad",
  name: "USAD",
  ticker: "USAD",
  units: [{ name: "USAD", code: "USAD", magnitude: 6 }],
  contractAddress: "usad_stablecoin.aleo",
  parentCurrencyId: aleoCurrency.id,
  tokenType: "arc22",
} as TokenCurrency;
