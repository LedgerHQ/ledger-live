import type { Currency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

const defaultColor = "#999";

export type ColorableCurrency = {
  type: Currency["type"];
  color?: string | undefined;
  id: string;
  ticker: string;
  parentCurrencyId?: string;
};

// Looser parameter type for getCurrencyColor: id is optional because the
// function never reads it, and legacy types-cryptoassets FiatCurrency has no id.
type ColorableCurrencyInput = Omit<ColorableCurrency, "id"> & { id?: string };

export function getCurrencyColor(currency: ColorableCurrencyInput | Currency): string {
  switch (currency.type) {
    case "CryptoCurrency":
      return currency.color ?? defaultColor;

    case "TokenCurrency":
      return (
        (currency.parentCurrencyId
          ? findCryptoCurrencyById(currency.parentCurrencyId)?.color
          : undefined) ?? defaultColor
      );

    default:
      return defaultColor;
  }
}
