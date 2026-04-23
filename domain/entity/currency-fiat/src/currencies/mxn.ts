import { fiat } from "../define";

export const mxn = fiat({
  type: "FiatCurrency",
  id: "mxn",
  name: "Mexican Peso",
  ticker: "MXN",
  symbol: "MX$",
  units: [{ name: "Mexican Peso", code: "MXN", magnitude: 2 }],
  keywords: ["peso", "mxn"],
});
