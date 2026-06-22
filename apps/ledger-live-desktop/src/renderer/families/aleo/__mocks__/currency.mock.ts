import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const aleoCurrency = getCryptoCurrencyById("aleo");

export const aleoTokenCurrency: TokenCurrency = {
  type: "TokenCurrency",
  id: "aleo_test_token",
  contractAddress: "token.aleo",
  parentCurrencyId: aleoCurrency.id,
  tokenType: "arc22",
  name: "Test Aleo Token",
  ticker: "TAT",
  units: [{ name: "Test Aleo Token", code: "TAT", magnitude: 6 }],
  disableCountervalue: true,
};
