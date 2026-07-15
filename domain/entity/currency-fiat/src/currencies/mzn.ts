import { fiat } from "../define";

export const mzn = fiat({
  type: "FiatCurrency",
  id: "mzn",
  ticker: "MZN",
  name: "Mozambican Metical",
  symbol: "MT",
  units: [
    {
      code: "MT",
      name: "Mozambican Metical",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
