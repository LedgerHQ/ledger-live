import { fiat } from "../define";

export const lak = fiat({
  type: "FiatCurrency",
  ticker: "LAK",
  name: "Lao Kip",
  symbol: "₭",
  units: [
    {
      code: "₭",
      name: "Lao Kip",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
