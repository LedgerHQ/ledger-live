import type { Currency } from "@ledgerhq/types-cryptoassets";

export const getCurrencyColor = (currency: Currency) => {
  switch (currency.type) {
    case "CryptoCurrency":
      return currency.color;

    case "TokenCurrency":
      return currency.parentCurrency.color;

    default:
      return "#999";
  }
};
