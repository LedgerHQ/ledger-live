import { fiat } from "../define";

export const tjs = fiat({
  type: "FiatCurrency",
  id: "tjs",
  ticker: "TJS",
  name: "Tajikistani Somoni",
  symbol: "TJS",
  units: [
    {
      code: "TJS",
      name: "Tajikistani Somoni",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
