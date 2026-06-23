import { fiat } from "../define";

export const pln = fiat({
  type: "FiatCurrency",
  id: "pln",
  ticker: "PLN",
  name: "Polish Złoty",
  symbol: "zł",
  units: [
    {
      code: "zł",
      name: "Polish Złoty",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
