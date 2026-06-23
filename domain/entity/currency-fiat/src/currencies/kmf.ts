import { fiat } from "../define";

export const kmf = fiat({
  type: "FiatCurrency",
  id: "kmf",
  ticker: "KMF",
  name: "Comorian Franc",
  symbol: "CF",
  units: [
    {
      code: "CF",
      name: "Comorian Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
