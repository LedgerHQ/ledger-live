import { fiat } from "../define";

export const cdf = fiat({
  type: "FiatCurrency",
  id: "cdf",
  ticker: "CDF",
  name: "Congolese Franc",
  symbol: "FC",
  units: [
    {
      code: "FC",
      name: "Congolese Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
