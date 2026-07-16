import { fiat } from "../define";

export const bbd = fiat({
  type: "FiatCurrency",
  id: "bbd",
  ticker: "BBD",
  name: "Barbadian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Barbadian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
