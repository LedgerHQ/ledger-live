import { fiat } from "../define";

export const xcd = fiat({
  type: "FiatCurrency",
  id: "xcd",
  ticker: "XCD",
  name: "East Caribbean Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "East Caribbean Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
