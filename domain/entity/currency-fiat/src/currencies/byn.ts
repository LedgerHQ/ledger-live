import { fiat } from "../define";

export const byn = fiat({
  type: "FiatCurrency",
  ticker: "BYN",
  name: "Belarusian Ruble",
  symbol: "р.",
  units: [
    {
      code: "р.",
      name: "Belarusian Ruble",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
