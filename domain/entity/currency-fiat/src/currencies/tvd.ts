import { fiat } from "../define";

export const tvd = fiat({
  type: "FiatCurrency",
  id: "tvd",
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
