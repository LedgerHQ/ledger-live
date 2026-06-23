import { fiat } from "../define";

export const twd = fiat({
  type: "FiatCurrency",
  id: "twd",
  ticker: "TWD",
  name: "New Taiwan Dollar",
  symbol: "NT$",
  units: [
    {
      code: "NT$",
      name: "New Taiwan Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
