import { fiat } from "../define";

export const cad = fiat({
  type: "FiatCurrency",
  id: "cad",
  ticker: "CAD",
  name: "Canadian Dollar",
  symbol: "CA$",
  units: [
    {
      code: "CA$",
      name: "Canadian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
