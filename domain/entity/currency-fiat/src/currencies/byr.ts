import { fiat } from "../define";

export const byr = fiat({
  type: "FiatCurrency",
  id: "byr",
  ticker: "BYR",
  name: "Belarusian Ruble (pre-2016)",
  symbol: "р.",
  units: [
    {
      code: "р.",
      name: "Belarusian Ruble (pre-2016)",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
