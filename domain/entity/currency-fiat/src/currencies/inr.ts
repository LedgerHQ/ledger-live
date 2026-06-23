import { fiat } from "../define";

export const inr = fiat({
  type: "FiatCurrency",
  id: "inr",
  ticker: "INR",
  name: "Indian Rupee",
  symbol: "₹",
  units: [
    {
      code: "₹",
      name: "Indian Rupee",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
