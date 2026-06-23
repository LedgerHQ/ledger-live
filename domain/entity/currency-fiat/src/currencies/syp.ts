import { fiat } from "../define";

export const syp = fiat({
  type: "FiatCurrency",
  id: "syp",
  ticker: "SYP",
  name: "Syrian Pound",
  symbol: "£",
  units: [
    {
      code: "£",
      name: "Syrian Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
