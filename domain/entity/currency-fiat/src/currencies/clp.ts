import { fiat } from "../define";

export const clp = fiat({
  type: "FiatCurrency",
  id: "clp",
  ticker: "CLP",
  name: "Chilean Peso",
  symbol: "CLP$",
  units: [
    {
      code: "CLP$",
      name: "Chilean Peso",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
