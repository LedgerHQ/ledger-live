import { fiat } from "../define";

export const usd = fiat({
  type: "FiatCurrency",
  id: "usd",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
  keywords: ["dollar", "usd"],
});
