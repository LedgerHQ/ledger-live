import { fiat } from "../define";

export const isk = fiat({
  type: "FiatCurrency",
  ticker: "ISK",
  name: "Iceland Krona",
  symbol: "kr.",
  units: [
    {
      code: "kr.",
      name: "Iceland Krona",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
