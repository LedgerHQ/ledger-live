import { fiat } from "../define";

export const jpy = fiat({
  type: "FiatCurrency",
  id: "jpy",
  ticker: "JPY",
  name: "Japanese Yen",
  symbol: "¥",
  units: [
    {
      code: "¥",
      name: "Japanese Yen",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
