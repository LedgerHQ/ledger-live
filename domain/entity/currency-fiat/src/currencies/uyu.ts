import { fiat } from "../define";

export const uyu = fiat({
  type: "FiatCurrency",
  id: "uyu",
  ticker: "UYU",
  name: "Uruguayan Peso",
  symbol: "$U",
  units: [
    {
      code: "$U",
      name: "Uruguayan Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
