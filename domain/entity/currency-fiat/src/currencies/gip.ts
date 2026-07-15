import { fiat } from "../define";

export const gip = fiat({
  type: "FiatCurrency",
  id: "gip",
  ticker: "GIP",
  name: "Gibraltar Pound",
  symbol: "£",
  units: [
    {
      code: "£",
      name: "Gibraltar Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
