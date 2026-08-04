import { fiat } from "../define";

export const btc = fiat({
  type: "FiatCurrency",
  ticker: "BTC",
  name: "Bitcoin",
  symbol: "₿",
  units: [
    {
      code: "₿",
      name: "Bitcoin",
      magnitude: 8,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
