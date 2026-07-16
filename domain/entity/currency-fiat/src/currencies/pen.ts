import { fiat } from "../define";

export const pen = fiat({
  type: "FiatCurrency",
  id: "pen",
  ticker: "PEN",
  name: "Peruvian Sol",
  symbol: "S/.",
  units: [
    {
      code: "S/.",
      name: "Peruvian Sol",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
