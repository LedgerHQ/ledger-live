import { fiat } from "../define";

export const btc = fiat({
  type: "FiatCurrency",
  id: "btc",
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
