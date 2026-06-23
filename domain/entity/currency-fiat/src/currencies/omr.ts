import { fiat } from "../define";

export const omr = fiat({
  type: "FiatCurrency",
  id: "omr",
  ticker: "OMR",
  name: "Omani Rial",
  symbol: "﷼",
  units: [
    {
      code: "﷼",
      name: "Omani Rial",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
