import { fiat } from "../define";

export const szl = fiat({
  type: "FiatCurrency",
  id: "szl",
  ticker: "SZL",
  name: "Swazi Lilangeni",
  symbol: "E",
  units: [
    {
      code: "E",
      name: "Swazi Lilangeni",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
