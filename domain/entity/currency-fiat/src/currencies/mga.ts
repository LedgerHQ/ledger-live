import { fiat } from "../define";

export const mga = fiat({
  type: "FiatCurrency",
  ticker: "MGA",
  name: "Malagasy Ariary",
  symbol: "Ar",
  units: [
    {
      code: "Ar",
      name: "Malagasy Ariary",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
