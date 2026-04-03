import { fiat } from "../define";

export const nzd = fiat({
  type: "FiatCurrency",
  id: "nzd",
  name: "New Zealand Dollar",
  ticker: "NZD",
  symbol: "NZ$",
  units: [{ name: "New Zealand Dollar", code: "NZD", magnitude: 2 }],
  keywords: ["new zealand dollar", "nzd"],
});
