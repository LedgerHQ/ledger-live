import { fiat } from "../define";

export const gyd = fiat({
  type: "FiatCurrency",
  id: "gyd",
  ticker: "GYD",
  name: "Guyanese Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Guyanese Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
