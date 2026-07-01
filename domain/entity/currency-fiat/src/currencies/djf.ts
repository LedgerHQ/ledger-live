import { fiat } from "../define";

export const djf = fiat({
  type: "FiatCurrency",
  id: "djf",
  ticker: "DJF",
  name: "Djiboutian Franc",
  symbol: "Fdj",
  units: [
    {
      code: "Fdj",
      name: "Djiboutian Franc",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
