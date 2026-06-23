import { fiat } from "../define";

export const pab = fiat({
  type: "FiatCurrency",
  id: "pab",
  ticker: "PAB",
  name: "Panamanian Balboa",
  symbol: "B/.",
  units: [
    {
      code: "B/.",
      name: "Panamanian Balboa",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
