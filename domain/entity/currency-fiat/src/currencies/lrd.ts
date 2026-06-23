import { fiat } from "../define";

export const lrd = fiat({
  type: "FiatCurrency",
  id: "lrd",
  ticker: "LRD",
  name: "Liberian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Liberian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
