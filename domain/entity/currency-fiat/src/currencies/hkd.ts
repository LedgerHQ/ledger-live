import { fiat } from "../define";

export const hkd = fiat({
  type: "FiatCurrency",
  id: "hkd",
  name: "Hong Kong Dollar",
  ticker: "HKD",
  symbol: "HK$",
  units: [{ name: "Hong Kong Dollar", code: "HKD", magnitude: 2 }],
  keywords: ["hong kong dollar", "hkd"],
});
