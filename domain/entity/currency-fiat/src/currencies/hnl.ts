import { fiat } from "../define";

export const hnl = fiat({
  type: "FiatCurrency",
  id: "hnl",
  ticker: "HNL",
  name: "Honduran Lempira",
  symbol: "L.",
  units: [
    {
      code: "L.",
      name: "Honduran Lempira",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
