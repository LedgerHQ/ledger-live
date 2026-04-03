import { fiat } from "../define";

export const zar = fiat({
  type: "FiatCurrency",
  id: "zar",
  name: "South African Rand",
  ticker: "ZAR",
  symbol: "R",
  units: [{ name: "South African Rand", code: "ZAR", magnitude: 2 }],
  keywords: ["rand", "zar"],
});
