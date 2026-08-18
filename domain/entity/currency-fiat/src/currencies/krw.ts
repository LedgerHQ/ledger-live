import { fiat } from "../define";

export const krw = fiat({
  type: "FiatCurrency",
  ticker: "KRW",
  name: "South Korean Won",
  symbol: "₩",
  units: [
    {
      code: "₩",
      name: "South Korean Won",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
