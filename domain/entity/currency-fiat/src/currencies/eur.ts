import { fiat } from "../define";

export const eur = fiat({
  type: "FiatCurrency",
  ticker: "EUR",
  name: "Euro",
  symbol: "€",
  units: [
    {
      code: "€",
      name: "Euro",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
