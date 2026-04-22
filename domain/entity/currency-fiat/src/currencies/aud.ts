import { fiat } from "../define";

export const aud = fiat({
  type: "FiatCurrency",
  id: "aud",
  name: "Australian Dollar",
  ticker: "AUD",
  symbol: "A$",
  units: [{ name: "Australian Dollar", code: "AUD", magnitude: 2 }],
  keywords: ["australian dollar", "aud"],
});
