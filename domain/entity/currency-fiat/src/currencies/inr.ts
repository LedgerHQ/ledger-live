import { fiat } from "../define";

export const inr = fiat({
  type: "FiatCurrency",
  id: "inr",
  name: "Indian Rupee",
  ticker: "INR",
  symbol: "₹",
  units: [{ name: "Indian Rupee", code: "INR", magnitude: 2 }],
  keywords: ["rupee", "inr"],
});
