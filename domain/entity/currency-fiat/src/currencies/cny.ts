import { fiat } from "../define";

export const cny = fiat({
  type: "FiatCurrency",
  id: "cny",
  name: "Chinese Yuan",
  ticker: "CNY",
  symbol: "¥",
  units: [{ name: "Chinese Yuan", code: "CNY", magnitude: 2 }],
  keywords: ["yuan", "renminbi", "cny"],
});
