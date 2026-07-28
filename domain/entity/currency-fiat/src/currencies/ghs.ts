import { fiat } from "../define";

export const ghs = fiat({
  type: "FiatCurrency",
  ticker: "GHS",
  name: "Ghanaian Cedi",
  symbol: "₵",
  units: [
    {
      code: "₵",
      name: "Ghanaian Cedi",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
