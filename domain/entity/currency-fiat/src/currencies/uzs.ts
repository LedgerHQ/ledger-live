import { fiat } from "../define";

export const uzs = fiat({
  type: "FiatCurrency",
  ticker: "UZS",
  name: "Uzbekistani Som",
  symbol: "сўм",
  units: [
    {
      code: "сўм",
      name: "Uzbekistani Som",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
