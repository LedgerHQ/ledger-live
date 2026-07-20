import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const aleoCurrency = getCryptoCurrencyById("aleo");

export const aleoTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "aleo/arc22/usad",
  name: "USAD",
  ticker: "USAD",
  units: [{ name: "USAD", code: "USAD", magnitude: 6 }],
  contractAddress: "usad_stablecoin.aleo",
  parentCurrencyId: aleoCurrency.id,
  tokenType: "arc22",
};
