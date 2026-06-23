import { fiat } from "../define";

export const pkr = fiat({
  type: "FiatCurrency",
  id: "pkr",
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
