import { fiat } from "../define";

export const bnd = fiat({
  type: "FiatCurrency",
  ticker: "BND",
  name: "Brunei Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Brunei Dollar",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
