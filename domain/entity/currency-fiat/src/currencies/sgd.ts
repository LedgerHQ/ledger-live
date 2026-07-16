import { fiat } from "../define";

export const sgd = fiat({
  type: "FiatCurrency",
  id: "sgd",
  ticker: "SGD",
  name: "Singapore Dollar",
  symbol: "S$",
  units: [
    {
      code: "S$",
      name: "Singapore Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
