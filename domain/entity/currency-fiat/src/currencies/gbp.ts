import { fiat } from "../define";

export const gbp = fiat({
  type: "FiatCurrency",
  id: "gbp",
  ticker: "GBP",
  name: "British Pound",
  symbol: "£",
  units: [
    {
      code: "£",
      name: "British Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
