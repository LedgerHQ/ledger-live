import { fiat } from "../define";

export const gbp = fiat({
  type: "FiatCurrency",
  id: "gbp",
  name: "British Pound",
  ticker: "GBP",
  symbol: "£",
  units: [{ name: "British Pound", code: "GBP", magnitude: 2 }],
  keywords: ["pound", "sterling", "gbp"],
});
