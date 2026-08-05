import { fiat } from "../define";

export const gmd = fiat({
  type: "FiatCurrency",
  ticker: "GMD",
  name: "Gambian Dalasi",
  symbol: "D",
  units: [
    {
      code: "D",
      name: "Gambian Dalasi",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
