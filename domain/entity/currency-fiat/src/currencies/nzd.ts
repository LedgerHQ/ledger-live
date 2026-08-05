import { fiat } from "../define";

export const nzd = fiat({
  type: "FiatCurrency",
  ticker: "NZD",
  name: "New Zealand Dollar",
  symbol: "NZ$",
  units: [
    {
      code: "NZ$",
      name: "New Zealand Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
