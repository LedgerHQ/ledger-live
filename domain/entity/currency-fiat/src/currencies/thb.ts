import { fiat } from "../define";

export const thb = fiat({
  type: "FiatCurrency",
  ticker: "THB",
  name: "Thai Baht",
  symbol: "฿",
  units: [
    {
      code: "฿",
      name: "Thai Baht",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
