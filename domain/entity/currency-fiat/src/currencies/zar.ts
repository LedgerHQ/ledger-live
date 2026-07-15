import { fiat } from "../define";

export const zar = fiat({
  type: "FiatCurrency",
  id: "zar",
  ticker: "ZAR",
  name: "South African Rand",
  symbol: "R",
  units: [
    {
      code: "R",
      name: "South African Rand",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
