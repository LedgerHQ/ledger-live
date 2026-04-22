import { fiat } from "../define";

export const jpy = fiat({
  type: "FiatCurrency",
  id: "jpy",
  name: "Japanese Yen",
  ticker: "JPY",
  symbol: "¥",
  units: [{ name: "Japanese Yen", code: "JPY", magnitude: 0 }],
  keywords: ["yen", "jpy"],
});
