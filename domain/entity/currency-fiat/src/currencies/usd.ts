import { fiat } from "../define";

export const usd = fiat({
  type: "FiatCurrency",
  ticker: "USD",
  name: "US Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "US Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
