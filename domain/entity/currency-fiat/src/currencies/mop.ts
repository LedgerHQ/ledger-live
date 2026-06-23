import { fiat } from "../define";

export const mop = fiat({
  type: "FiatCurrency",
  id: "mop",
  ticker: "MOP",
  name: "Macanese Pataca",
  symbol: "MOP$",
  units: [
    {
      code: "MOP$",
      name: "Macanese Pataca",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
