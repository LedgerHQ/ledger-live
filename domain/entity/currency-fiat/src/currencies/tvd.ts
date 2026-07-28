import { fiat } from "../define";

export const tvd = fiat({
  type: "FiatCurrency",
  ticker: "TVD",
  name: "Tuvaluan Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Tuvaluan Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
