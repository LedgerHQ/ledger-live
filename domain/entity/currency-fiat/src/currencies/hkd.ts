import { fiat } from "../define";

export const hkd = fiat({
  type: "FiatCurrency",
  id: "hkd",
  ticker: "HKD",
  name: "Hong Kong Dollar",
  symbol: "HK$",
  units: [
    {
      code: "HK$",
      name: "Hong Kong Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
