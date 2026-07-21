import type { CryptoCurrency, Currency } from "@ledgerhq/ledger-wallet-framework/types";

export function isCantonCurrency(currency: Currency): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency" && currency.family === "canton";
}
