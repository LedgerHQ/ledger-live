import { fiat } from "../define";

export const tzs = fiat({
  type: "FiatCurrency",
  id: "tzs",
  ticker: "TZS",
  name: "Tanzanian Shilling",
  symbol: "TSh",
  units: [
    {
      code: "TSh",
      name: "Tanzanian Shilling",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
