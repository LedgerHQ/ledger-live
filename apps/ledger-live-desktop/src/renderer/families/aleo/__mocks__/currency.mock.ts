import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";

export const aleoCurrency = getCryptoCurrencyById("aleo");

export const aleoTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("aleo_test_token"),
  contractAddress: "token.aleo",
  parentCurrencyId: aleoCurrency.id,
  tokenType: "arc22",
  name: "Test Aleo Token",
  ticker: "TAT",
  units: [{ name: "Test Aleo Token", code: "TAT", magnitude: 6 }],
  disableCountervalue: true,
};
