import { fiat } from "../define";

export const mur = fiat({
  type: "FiatCurrency",
  id: "mur",
  ticker: "MUR",
  name: "Mauritian Rupee",
  symbol: "₨",
  units: [
    {
      code: "₨",
      name: "Mauritian Rupee",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
