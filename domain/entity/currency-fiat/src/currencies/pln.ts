import { fiat } from "../define";

export const pln = fiat({
  type: "FiatCurrency",
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
