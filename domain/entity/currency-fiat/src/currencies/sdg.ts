import { fiat } from "../define";

export const sdg = fiat({
  type: "FiatCurrency",
  id: "sdg",
  ticker: "SDG",
  name: "Sudanese Pound",
  symbol: "£‏",
  units: [
    {
      code: "£‏",
      name: "Sudanese Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
