import { fiat } from "../define";

export const bmd = fiat({
  type: "FiatCurrency",
  id: "bmd",
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
