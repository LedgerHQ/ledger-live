import { fiat } from "../define";

export const kes = fiat({
  type: "FiatCurrency",
  id: "kes",
  ticker: "KES",
  name: "Kenyan Shilling",
  symbol: "KSh",
  units: [
    {
      code: "KSh",
      name: "Kenyan Shilling",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
