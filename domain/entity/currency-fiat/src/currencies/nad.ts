import { fiat } from "../define";

export const nad = fiat({
  type: "FiatCurrency",
  id: "nad",
  ticker: "NAD",
  name: "Namibian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Namibian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
