import { fiat } from "../define";

export const npr = fiat({
  type: "FiatCurrency",
  id: "npr",
  ticker: "NPR",
  name: "Nepalese Rupee",
  symbol: "₨",
  units: [
    {
      code: "₨",
      name: "Nepalese Rupee",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
