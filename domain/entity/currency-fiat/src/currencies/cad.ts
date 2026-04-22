import { fiat } from "../define";

export const cad = fiat({
  type: "FiatCurrency",
  id: "cad",
  name: "Canadian Dollar",
  ticker: "CAD",
  symbol: "C$",
  units: [{ name: "Canadian Dollar", code: "CAD", magnitude: 2 }],
  keywords: ["canadian dollar", "cad"],
});
