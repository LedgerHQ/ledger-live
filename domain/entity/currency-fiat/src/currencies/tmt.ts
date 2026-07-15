import { fiat } from "../define";

export const tmt = fiat({
  type: "FiatCurrency",
  id: "tmt",
  ticker: "TMT",
  name: "Turkmenistani Manat",
  symbol: "m",
  units: [
    {
      code: "m",
      name: "Turkmenistani Manat",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
