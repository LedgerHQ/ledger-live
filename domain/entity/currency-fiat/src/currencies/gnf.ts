import { fiat } from "../define";

export const gnf = fiat({
  type: "FiatCurrency",
  id: "gnf",
  ticker: "GNF",
  name: "Guinean Franc",
  symbol: "FG",
  units: [
    {
      code: "FG",
      name: "Guinean Franc",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
