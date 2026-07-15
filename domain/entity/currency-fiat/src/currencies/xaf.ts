import { fiat } from "../define";

export const xaf = fiat({
  type: "FiatCurrency",
  id: "xaf",
  ticker: "XAF",
  name: "Central African CFA Franc",
  symbol: "F",
  units: [
    {
      code: "F",
      name: "Central African CFA Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
