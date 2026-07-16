import { fiat } from "../define";

export const kzt = fiat({
  type: "FiatCurrency",
  id: "kzt",
  ticker: "KZT",
  name: "Kazakhstani Tenge",
  symbol: "₸",
  units: [
    {
      code: "₸",
      name: "Kazakhstani Tenge",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
