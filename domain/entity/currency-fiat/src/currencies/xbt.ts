import { fiat } from "../define";

export const xbt = fiat({
  type: "FiatCurrency",
  id: "xbt",
  ticker: "XBT",
  name: "Bitcoin",
  symbol: "Ƀ",
  units: [
    {
      code: "Ƀ",
      name: "Bitcoin",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
