import { fiat } from "../define";

export const fjd = fiat({
  type: "FiatCurrency",
  id: "fjd",
  ticker: "FJD",
  name: "Fijian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Fijian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
