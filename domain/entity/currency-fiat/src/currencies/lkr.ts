import { fiat } from "../define";

export const lkr = fiat({
  type: "FiatCurrency",
  id: "lkr",
  ticker: "LKR",
  name: "Sri Lankan Rupee",
  symbol: "₨",
  units: [
    {
      code: "₨",
      name: "Sri Lankan Rupee",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
