import { fiat } from "../define";

export const nio = fiat({
  type: "FiatCurrency",
  id: "nio",
  ticker: "NIO",
  name: "Nicaraguan Córdoba",
  symbol: "C$",
  units: [
    {
      code: "C$",
      name: "Nicaraguan Córdoba",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
