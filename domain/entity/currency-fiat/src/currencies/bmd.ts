import { fiat } from "../define";

export const bmd = fiat({
  type: "FiatCurrency",
  ticker: "BMD",
  name: "Bermudian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Bermudian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
