import type { Currency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";

const defaultColor = "#999";

export type ColorableCurrency = {
  type: Currency["type"];
  color?: string | undefined;
  id: string;
  ticker: string;
  parentCurrencyId?: string;
};

export function getCurrencyColor(currency: ColorableCurrency | Currency): string {
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
