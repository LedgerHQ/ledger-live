import { fiat } from "../define";

export const mvr = fiat({
  type: "FiatCurrency",
  ticker: "MVR",
  name: "Maldivian Rufiyaa",
  symbol: "MVR",
  units: [
    {
      code: "MVR",
      name: "Maldivian Rufiyaa",
      magnitude: 1,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
