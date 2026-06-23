import { fiat } from "../define";

export const vnd = fiat({
  type: "FiatCurrency",
  id: "vnd",
  ticker: "VND",
  name: "Vietnamese Dong",
  symbol: "₫",
  units: [
    {
      code: "₫",
      name: "Vietnamese Dong",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
