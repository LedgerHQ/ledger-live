import { fiat } from "../define";

export const aed = fiat({
  type: "FiatCurrency",
  id: "aed",
  ticker: "AED",
  name: "Emirati Dirham",
  symbol: "د.إ.",
  units: [
    {
      code: "د.إ.",
      name: "Emirati Dirham",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
