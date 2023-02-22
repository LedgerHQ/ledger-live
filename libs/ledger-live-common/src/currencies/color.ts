import type { Currency } from "@ledgerhq/types-cryptoassets";

const defaultColor = "#999";

export type ColorableCurrency = {
  type: Currency["type"];
  color?: string | undefined;
  id: string;
  ticker: string;
  parentCurrency?: {
    color?: string | undefined;
  };
};

export function getCurrencyColor(
  currency: ColorableCurrency | Currency
): string {
  switch (currency.type) {
    case "CryptoCurrency":
      return currency.color ?? defaultColor;

    case "TokenCurrency":
      return currency?.parentCurrency?.color ?? defaultColor;

    default:
      return defaultColor;
  }
}
