import { fiat } from "../define";

export const htg = fiat({
  type: "FiatCurrency",
  ticker: "HTG",
  name: "Haitian Gourde",
  symbol: "G",
  units: [
    {
      code: "G",
      name: "Haitian Gourde",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
