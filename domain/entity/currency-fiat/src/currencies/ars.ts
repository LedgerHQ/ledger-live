import { fiat } from "../define";

export const ars = fiat({
  type: "FiatCurrency",
  id: "ars",
  ticker: "ARS",
  name: "Argentine Peso",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Argentine Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
