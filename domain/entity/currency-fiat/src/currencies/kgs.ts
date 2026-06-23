import { fiat } from "../define";

export const kgs = fiat({
  type: "FiatCurrency",
  id: "kgs",
  ticker: "KGS",
  name: "Kyrgyzstani Som",
  symbol: "сом",
  units: [
    {
      code: "сом",
      name: "Kyrgyzstani Som",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
