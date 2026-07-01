import { fiat } from "../define";

export const chf = fiat({
  type: "FiatCurrency",
  id: "chf",
  ticker: "CHF",
  name: "Swiss Franc",
  symbol: "CHF",
  units: [
    {
      code: "CHF",
      name: "Swiss Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
