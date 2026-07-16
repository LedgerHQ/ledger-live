import { fiat } from "../define";

export const shp = fiat({
  type: "FiatCurrency",
  id: "shp",
  ticker: "SHP",
  name: "Saint Helena Pound",
  symbol: "£",
  units: [
    {
      code: "£",
      name: "Saint Helena Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
