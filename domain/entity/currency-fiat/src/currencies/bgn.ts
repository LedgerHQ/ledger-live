import { fiat } from "../define";

export const bgn = fiat({
  type: "FiatCurrency",
  id: "bgn",
  ticker: "BGN",
  name: "Bulgarian Lev",
  symbol: "лв.",
  units: [
    {
      code: "лв.",
      name: "Bulgarian Lev",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
