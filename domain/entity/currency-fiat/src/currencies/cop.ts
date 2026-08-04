import { fiat } from "../define";

export const cop = fiat({
  type: "FiatCurrency",
  ticker: "COP",
  name: "Colombian Peso",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Colombian Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
