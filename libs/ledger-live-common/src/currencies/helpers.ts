import { Currency, CryptoCurrency, TokenCurrency } from "../types";
import { listTokens, listSupportedCurrencies } from "../currencies";

export function isCryptoCurrency(
  currency: Currency
): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency(currency: Currency): currency is TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function listCurrencies(includeTokens: boolean): Currency[] {
  const currencies = listSupportedCurrencies();

  if (!includeTokens) {
    return currencies;
  }

  const allTokens = listTokens().filter(
    ({ tokenType }) => tokenType === "erc20" || tokenType === "bep20"
  );

  return [...currencies, ...allTokens];
}
