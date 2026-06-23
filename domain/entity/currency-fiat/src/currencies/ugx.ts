import { fiat } from "../define";

export const ugx = fiat({
  type: "FiatCurrency",
  id: "ugx",
  ticker: "UGX",
  name: "Ugandan Shilling",
  symbol: "USh",
  units: [
    {
      code: "USh",
      name: "Ugandan Shilling",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
