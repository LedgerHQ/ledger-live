import { fiat } from "../define";

export const top = fiat({
  type: "FiatCurrency",
  id: "top",
  ticker: "TOP",
  name: "Tongan Pa'anga",
  symbol: "T$",
  units: [
    {
      code: "T$",
      name: "Tongan Pa'anga",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
