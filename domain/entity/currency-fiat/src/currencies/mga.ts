import { fiat } from "../define";

export const mga = fiat({
  type: "FiatCurrency",
  id: "mga",
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
