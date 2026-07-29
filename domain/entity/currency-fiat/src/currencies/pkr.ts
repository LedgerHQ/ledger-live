import { fiat } from "../define";

export const pkr = fiat({
  type: "FiatCurrency",
  ticker: "PKR",
  name: "Pakistani Rupee",
  symbol: "₨",
  units: [
    {
      code: "₨",
      name: "Pakistani Rupee",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
