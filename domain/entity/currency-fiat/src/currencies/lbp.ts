import { fiat } from "../define";

export const lbp = fiat({
  type: "FiatCurrency",
  id: "lbp",
  ticker: "LBP",
  name: "Lebanese Pound",
  symbol: "ل.ل.‏",
  units: [
    {
      code: "ل.ل.‏",
      name: "Lebanese Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
