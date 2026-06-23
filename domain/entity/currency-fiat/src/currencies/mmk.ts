import { fiat } from "../define";

export const mmk = fiat({
  type: "FiatCurrency",
  id: "mmk",
  ticker: "MMK",
  name: "Myanmar Kyat",
  symbol: "K",
  units: [
    {
      code: "K",
      name: "Myanmar Kyat",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
