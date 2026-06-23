import { fiat } from "../define";

export const awg = fiat({
  type: "FiatCurrency",
  id: "awg",
  ticker: "AWG",
  name: "Aruban Florin",
  symbol: "ƒ",
  units: [
    {
      code: "ƒ",
      name: "Aruban Florin",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
