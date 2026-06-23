import { fiat } from "../define";

export const dkk = fiat({
  type: "FiatCurrency",
  id: "dkk",
  ticker: "DKK",
  name: "Danish Krone",
  symbol: "kr.",
  units: [
    {
      code: "kr.",
      name: "Danish Krone",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
