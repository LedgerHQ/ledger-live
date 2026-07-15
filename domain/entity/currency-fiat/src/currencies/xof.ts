import { fiat } from "../define";

export const xof = fiat({
  type: "FiatCurrency",
  id: "xof",
  ticker: "XOF",
  name: "West African CFA Franc",
  symbol: "F",
  units: [
    {
      code: "F",
      name: "West African CFA Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
