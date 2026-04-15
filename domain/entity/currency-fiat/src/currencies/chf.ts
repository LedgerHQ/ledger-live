import { fiat } from "../define";

export const chf = fiat({
  type: "FiatCurrency",
  id: "chf",
  name: "Swiss Franc",
  ticker: "CHF",
  symbol: "Fr",
  units: [{ name: "Swiss Franc", code: "CHF", magnitude: 2 }],
  keywords: ["franc", "chf"],
});
