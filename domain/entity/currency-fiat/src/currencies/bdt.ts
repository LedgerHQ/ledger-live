import { fiat } from "../define";

export const bdt = fiat({
  type: "FiatCurrency",
  id: "bdt",
  ticker: "BDT",
  name: "Bangladeshi Taka",
  symbol: "৳",
  units: [
    {
      code: "৳",
      name: "Bangladeshi Taka",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
