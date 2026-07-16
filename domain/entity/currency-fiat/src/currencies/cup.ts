import { fiat } from "../define";

export const cup = fiat({
  type: "FiatCurrency",
  id: "cup",
  ticker: "CUP",
  name: "Cuban Peso",
  symbol: "$MN",
  units: [
    {
      code: "$MN",
      name: "Cuban Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
