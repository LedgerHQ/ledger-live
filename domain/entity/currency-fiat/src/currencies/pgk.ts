import { fiat } from "../define";

export const pgk = fiat({
  type: "FiatCurrency",
  ticker: "PGK",
  name: "Papua New Guinean Kina",
  symbol: "K",
  units: [
    {
      code: "K",
      name: "Papua New Guinean Kina",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
