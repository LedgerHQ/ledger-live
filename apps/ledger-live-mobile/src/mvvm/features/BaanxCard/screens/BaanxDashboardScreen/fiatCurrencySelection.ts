import type { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

type LumenTheme = ReturnType<typeof useTheme>["theme"];

export type FiatCurrency = {
  readonly code: string;
  readonly symbol: string;
  readonly label: string;
  readonly selectedSurface?: string;
  readonly selectedOnSurface?: string;
};

export const FIAT_CURRENCIES: readonly FiatCurrency[] = [
  {
    code: "USD",
    symbol: "$",
    label: "US Dollar",
    selectedSurface: "#000000",
    selectedOnSurface: "#FFFFFF",
  },
  {
    code: "EUR",
    symbol: "€",
    label: "Euro",
    selectedSurface: "#001489",
    selectedOnSurface: "#FFFFFF",
  },
  {
    code: "GBP",
    symbol: "£",
    label: "British Pound",
    selectedSurface: "#142266",
    selectedOnSurface: "#FFFFFF",
  },
  {
    code: "JPY",
    symbol: "¥",
    label: "Japanese Yen",
    selectedSurface: "#BC0021",
    selectedOnSurface: "#FFFFFF",
  },
  {
    code: "CHF",
    symbol: "Fr",
    label: "Swiss Franc",
    selectedSurface: "#FF0000",
    selectedOnSurface: "#FFFFFF",
  },
];

export type FiatSelectionSurface = {
  readonly backgroundColor: string;
  readonly foregroundColor: string;
};

export function getSelectedFiatSurface(
  theme: LumenTheme,
  currencyCode: string,
): FiatSelectionSurface {
  const entry = FIAT_CURRENCIES.find(c => c.code === currencyCode);
  return {
    backgroundColor: entry?.selectedSurface ?? theme.colors.text.base,
    foregroundColor: entry?.selectedOnSurface ?? theme.colors.bg.base,
  };
}
