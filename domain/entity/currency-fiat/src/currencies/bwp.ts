import { fiat } from "../define";

export const bwp = fiat({
  type: "FiatCurrency",
  id: "bwp",
  ticker: "BWP",
  name: "Botswana Pula",
  symbol: "P",
  units: [
    {
      code: "P",
      name: "Botswana Pula",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
